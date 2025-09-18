import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Invitation as InvitationEntity,
  InvitationStatus,
  NotePermission,
  NoteRole,
  Note,
  User,
  NotificationType,
} from '../entities';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import { InvitationResponseDto, InvitationItem } from './dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(NotePermission)
    private readonly notePermissionRepository: Repository<NotePermission>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMyInvitations(userId: string): Promise<InvitationResponseDto[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invitations = await this.invitationRepository.find({
      where: { inviteeEmail: user.email, status: InvitationStatus.PENDING },
      relations: ['inviter', 'note', 'note.owner'],
      order: { createdAt: 'DESC' },
    });

    // Mark expired
    const now = new Date();
    const expired = invitations.filter((i) => i.expiresAt <= now);
    if (expired.length) {
      await this.invitationRepository.update(
        expired.map((i) => i.id),
        { status: InvitationStatus.EXPIRED },
      );
    }

    return invitations
      .filter((i) => i.expiresAt > now)
      .map((i) => this.toResponseDto(i));
  }

  async getInvitationsForNote(
    noteId: string,
    userId: string,
  ): Promise<InvitationResponseDto[]> {
    const canView = await this.checkSharePermission(noteId, userId);
    if (!canView) throw new ForbiddenException('No permission');
    const invitations = await this.invitationRepository.find({
      where: { noteId },
      relations: ['inviter', 'invitee', 'note'],
      order: { createdAt: 'DESC' },
    });
    return invitations.map((i) => this.toResponseDto(i));
  }

  async createInvitation(
    inviterId: string,
    noteId: string,
    inviteeEmail: string,
    role: string,
    _noteTitle?: string,
    inviterName?: string,
  ) {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['owner'],
    });
    if (!note) throw new NotFoundException('Note not found');
    const hasPermission = await this.checkSharePermission(noteId, inviterId);
    if (!hasPermission) throw new ForbiddenException('No permission to share');

    const inviter = await this.userRepository.findOne({
      where: { id: inviterId },
    });
    if (!inviter) throw new NotFoundException('Inviter not found');
    if (inviter.email === inviteeEmail)
      throw new BadRequestException('Cannot invite yourself');

    // Existing pending invite
    const existingInvitation = await this.invitationRepository.findOne({
      where: { noteId, inviteeEmail, status: InvitationStatus.PENDING },
    });
    if (existingInvitation)
      throw new ConflictException('Invitation already exists');

    // Already has permission?
    const invitee = await this.userRepository.findOne({
      where: { email: inviteeEmail },
    });
    if (invitee) {
      const existingPerm = await this.notePermissionRepository.findOne({
        where: { noteId, userId: invitee.id },
      });
      if (existingPerm) throw new ConflictException('User already has access');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const roleUpper = (role || '').toUpperCase();
    const noteRole =
      roleUpper === 'EDITOR'
        ? NoteRole.EDITOR
        : roleUpper === 'COMMENTER'
          ? NoteRole.COMMENTER
          : NoteRole.VIEWER;

    const newInvitation = await this.invitationRepository.save({
      token,
      noteId,
      inviterId,
      inviteeEmail,
      inviteeId: invitee?.id || null,
      role: noteRole,
      expiresAt,
    });

    // Notify invitee if registered
    if (invitee) {
      await this.notifications.create(
        invitee.id,
        NotificationType.NOTE_INVITATION,
        'Note invitation',
        `${inviterName || inviter.name} invited you to ${note.title}`,
        { noteId, token },
      );
    }

    return this.toResponseDto({
      ...newInvitation,
      note,
      inviter,
    } as InvitationEntity);
  }

  async createBulkInvitations(
    inviterId: string,
    noteId: string,
    invitations: InvitationItem[],
    inviterName?: string,
  ) {
    // Validate note exists and user has permission
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['owner'],
    });
    if (!note) throw new NotFoundException('Note not found');

    const hasPermission = await this.checkSharePermission(noteId, inviterId);
    if (!hasPermission) throw new ForbiddenException('No permission to share');

    const inviter = await this.userRepository.findOne({
      where: { id: inviterId },
    });
    if (!inviter) throw new NotFoundException('Inviter not found');

    const results: {
      success: number;
      errors: Array<{ email: string; error: string }>;
      created: InvitationResponseDto[];
    } = {
      success: 0,
      errors: [],
      created: [],
    };

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Skip if trying to invite self
        if (inviter.email === invitation.email) {
          results.errors.push({
            email: invitation.email,
            error: 'Cannot invite yourself',
          });
          continue;
        }

        // Check for existing pending invitation
        const existingInvitation = await this.invitationRepository.findOne({
          where: {
            noteId,
            inviteeEmail: invitation.email,
            status: InvitationStatus.PENDING,
          },
        });
        if (existingInvitation) {
          results.errors.push({
            email: invitation.email,
            error: 'Invitation already exists',
          });
          continue;
        }

        // Check if user already has access
        const invitee = await this.userRepository.findOne({
          where: { email: invitation.email },
        });
        if (invitee) {
          const existingPerm = await this.notePermissionRepository.findOne({
            where: { noteId, userId: invitee.id },
          });
          if (existingPerm) {
            results.errors.push({
              email: invitation.email,
              error: 'User already has access',
            });
            continue;
          }
        }

        // Create invitation
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const roleUpper = (invitation.role || '').toString().toUpperCase();
        const noteRole =
          roleUpper === 'EDITOR'
            ? NoteRole.EDITOR
            : roleUpper === 'COMMENTER'
              ? NoteRole.COMMENTER
              : NoteRole.VIEWER;

        const newInvitation = await this.invitationRepository.save({
          token,
          noteId,
          inviterId,
          inviteeEmail: invitation.email,
          inviteeId: invitee?.id || null,
          role: noteRole,
          expiresAt,
        });

        // Notify invitee if registered
        if (invitee) {
          await this.notifications.create(
            invitee.id,
            NotificationType.NOTE_INVITATION,
            'Note invitation',
            `${inviterName || inviter.name} invited you to ${note.title}`,
            { noteId, token },
          );
        }

        results.success++;
        results.created.push(
          this.toResponseDto({
            ...newInvitation,
            note,
            inviter,
            invitee,
          } as InvitationEntity),
        );
      } catch (error) {
        results.errors.push({
          email: invitation.email,
          error: error.message || 'Failed to create invitation',
        });
      }
    }

    return results;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email !== invitation.inviteeEmail) {
      throw new ForbiddenException('This invitation is not for your email');
    }

    // Ensure permission
    const existingPermission = await this.notePermissionRepository.findOne({
      where: { noteId: invitation.noteId, userId },
    });
    if (!existingPermission) {
      await this.notePermissionRepository.save({
        noteId: invitation.noteId,
        userId,
        role: invitation.role,
        grantedById: invitation.inviterId,
      });
    }

    // Mark accepted
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      inviteeId: userId,
    });
    return { message: 'Invitation accepted successfully' };
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email !== invitation.inviteeEmail) {
      throw new ForbiddenException('This invitation is not for your email');
    }
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.DECLINED,
      inviteeId: userId,
    });
    return { message: 'Invitation declined' };
  }

  private toResponseDto(invitation: InvitationEntity): InvitationResponseDto {
    return plainToClass(InvitationResponseDto, {
      id: invitation.id,
      token: invitation.token,
      noteId: invitation.noteId,
      note: invitation.note
        ? {
            id: invitation.note.id,
            title: invitation.note.title,
            owner: invitation.note.owner
              ? {
                  id: invitation.note.owner.id,
                  name: invitation.note.owner.name,
                  email: invitation.note.owner.email,
                }
              : undefined,
          }
        : undefined,
      inviterId: invitation.inviterId,
      inviter: invitation.inviter
        ? {
            id: invitation.inviter.id,
            name: invitation.inviter.name,
            email: invitation.inviter.email,
          }
        : undefined,
      inviteeEmail: invitation.inviteeEmail,
      inviteeId: invitation.inviteeId || undefined,
      invitee: invitation.invitee
        ? {
            id: invitation.invitee.id,
            name: invitation.invitee.name,
            email: invitation.invitee.email,
          }
        : undefined,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    });
  }

  private async checkSharePermission(
    noteId: string,
    userId: string,
  ): Promise<boolean> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, ownerId: userId },
    });
    if (note) return true;
    const perm = await this.notePermissionRepository.findOne({
      where: { noteId, userId, role: NoteRole.EDITOR },
    });
    return !!perm;
  }
}
