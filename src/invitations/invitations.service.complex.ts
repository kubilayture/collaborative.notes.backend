import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationStatus, NotePermission, NoteRole, Note, User } from '../entities';
import { CreateInvitationDto, InvitationResponseDto } from './dto';
import { plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(NotePermission)
    private readonly notePermissionRepository: Repository<NotePermission>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    inviterId: string,
    createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const { noteId, inviteeEmail, role } = createInvitationDto;

    // Check if note exists and user has access to share it
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ['owner'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check if user has permission to share this note (must be owner or editor)
    const hasPermission = await this.checkSharePermission(noteId, inviterId);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to share this note');
    }

    // Check if user is trying to invite themselves
    const inviter = await this.userRepository.findOne({ where: { id: inviterId } });
    if (inviter?.email === inviteeEmail) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if there's already an active invitation for this email and note
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        noteId,
        inviteeEmail,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An invitation for this email already exists for this note');
    }

    // Check if the user already has permission for this note
    const invitee = await this.userRepository.findOne({ where: { email: inviteeEmail } });
    if (invitee) {
      const existingPermission = await this.notePermissionRepository.findOne({
        where: { noteId, userId: invitee.id },
      });

      if (existingPermission) {
        throw new ConflictException('User already has access to this note');
      }
    }

    // Generate unique invitation token
    const token = this.generateInvitationToken();

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await this.invitationRepository.save({
      token,
      noteId,
      inviterId,
      inviteeEmail,
      inviteeId: invitee?.id || null,
      role,
      expiresAt,
    });

    return this.findById(invitation.id);
  }

  async findByNoteId(noteId: string, userId: string): Promise<InvitationResponseDto[]> {
    // Check if user has access to this note
    const hasPermission = await this.checkSharePermission(noteId, userId);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view invitations for this note');
    }

    const invitations = await this.invitationRepository.find({
      where: { noteId },
      relations: ['inviter', 'invitee', 'note'],
      order: { createdAt: 'DESC' },
    });

    return invitations.map(invitation => this.toResponseDto(invitation));
  }

  async accept(token: string, userId: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['note', 'inviter'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new BadRequestException('This invitation has expired');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the invitation is for this user's email
    if (user.email !== invitation.inviteeEmail) {
      throw new ForbiddenException('This invitation is not for your email address');
    }

    // Check if user already has permission for this note
    const existingPermission = await this.notePermissionRepository.findOne({
      where: { noteId: invitation.noteId, userId },
    });

    if (existingPermission) {
      // Update invitation status to accepted
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.ACCEPTED,
        inviteeId: userId,
      });
      return { message: 'You already have access to this note' };
    }

    // Create permission
    await this.notePermissionRepository.save({
      noteId: invitation.noteId,
      userId,
      role: invitation.role,
      grantedById: invitation.inviterId,
    });

    // Update invitation status
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      inviteeId: userId,
    });

    return { message: 'Invitation accepted successfully' };
  }

  async decline(token: string, userId: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the invitation is for this user's email
    if (user.email !== invitation.inviteeEmail) {
      throw new ForbiddenException('This invitation is not for your email address');
    }

    // Update invitation status
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.DECLINED,
      inviteeId: userId,
    });

    return { message: 'Invitation declined' };
  }

  async cancel(invitationId: string, userId: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user has permission to cancel this invitation
    const hasPermission = await this.checkSharePermission(invitation.noteId, userId);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to cancel this invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled');
    }

    await this.invitationRepository.remove(invitation);

    return { message: 'Invitation cancelled' };
  }

  async findByToken(token: string): Promise<InvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['inviter', 'note', 'note.owner'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.toResponseDto(invitation);
  }

  async findPendingForUser(userId: string): Promise<InvitationResponseDto[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invitations = await this.invitationRepository.find({
      where: {
        inviteeEmail: user.email,
        status: InvitationStatus.PENDING,
      },
      relations: ['inviter', 'note', 'note.owner'],
      order: { createdAt: 'DESC' },
    });

    // Filter out expired invitations
    const validInvitations = invitations.filter(inv => inv.expiresAt > new Date());
    
    // Mark expired invitations
    const expiredInvitations = invitations.filter(inv => inv.expiresAt <= new Date());
    if (expiredInvitations.length > 0) {
      await this.invitationRepository.update(
        expiredInvitations.map(inv => inv.id),
        { status: InvitationStatus.EXPIRED },
      );
    }

    return validInvitations.map(invitation => this.toResponseDto(invitation));
  }

  private async findById(invitationId: string): Promise<InvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['inviter', 'invitee', 'note'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.toResponseDto(invitation);
  }

  private async checkSharePermission(noteId: string, userId: string): Promise<boolean> {
    // Check if user is the owner
    const note = await this.noteRepository.findOne({
      where: { id: noteId, ownerId: userId },
    });

    if (note) {
      return true;
    }

    // Check if user has editor permission
    const permission = await this.notePermissionRepository.findOne({
      where: { noteId, userId, role: NoteRole.EDITOR },
    });

    return !!permission;
  }

  private generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private toResponseDto(invitation: Invitation): InvitationResponseDto {
    return plainToClass(InvitationResponseDto, {
      id: invitation.id,
      token: invitation.token,
      noteId: invitation.noteId,
      note: invitation.note ? {
        id: invitation.note.id,
        title: invitation.note.title,
        owner: invitation.note.owner ? {
          id: invitation.note.owner.id,
          name: invitation.note.owner.name,
          email: invitation.note.owner.email,
        } : undefined,
      } : undefined,
      inviterId: invitation.inviterId,
      inviter: invitation.inviter ? {
        id: invitation.inviter.id,
        name: invitation.inviter.name,
        email: invitation.inviter.email,
      } : undefined,
      inviteeEmail: invitation.inviteeEmail,
      inviteeId: invitation.inviteeId,
      invitee: invitation.invitee ? {
        id: invitation.invitee.id,
        name: invitation.invitee.name,
        email: invitation.invitee.email,
      } : undefined,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    });
  }
}