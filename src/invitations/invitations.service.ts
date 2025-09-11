import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotePermission, NoteRole } from '../entities';

export interface Invitation {
  id: string;
  token: string;
  noteId: string;
  note: {
    id: string;
    title: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  inviterId: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  inviteeEmail: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(NotePermission)
    private readonly notePermissionRepository: Repository<NotePermission>,
  ) {}
  // In-memory storage for invitations (for testing purposes)
  private invitations: Invitation[] = [
    // Keep the original mock data
    {
      id: '1',
      token: 'mock-token-1',
      noteId: '7827cb43-7a7e-47da-bdc5-a4890b245a23',
      note: {
        id: '7827cb43-7a7e-47da-bdc5-a4890b245a23',
        title: 'Collaboration Project Notes',
        owner: {
          id: 'owner-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      inviterId: 'inviter-1',
      inviter: {
        id: 'inviter-1',
        name: 'Alice Smith',
        email: 'alice@example.com',
      },
      inviteeEmail: 'user@example.com',
      role: 'EDITOR',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  async getMyInvitations(userId: string) {
    // Return invitations for the current user (where they are the invitee)
    // For now, we'll filter by a mock email since we don't have user service integration
    return this.invitations.filter(invitation => 
      invitation.inviteeEmail === 'user@example.com' || // Mock current user email
      invitation.inviteeEmail.includes('@') // Or any real email for testing
    );
  }

  async getInvitationsForNote(noteId: string) {
    // Return all invitations for a specific note
    return this.invitations.filter(invitation => invitation.noteId === noteId);
  }

  async createInvitation(inviterId: string, noteId: string, inviteeEmail: string, role: string, noteTitle?: string, inviterName?: string, inviterEmail?: string) {
    const invitationId = Date.now().toString();
    const token = `invitation-${invitationId}`;
    
    const newInvitation: Invitation = {
      id: invitationId,
      token,
      noteId,
      note: {
        id: noteId,
        title: noteTitle || 'Untitled Note',
        owner: {
          id: inviterId,
          name: inviterName || 'Current User',
          email: inviterEmail || 'user@example.com',
        },
      },
      inviterId,
      inviter: {
        id: inviterId,
        name: inviterName || 'Current User',
        email: inviterEmail || 'user@example.com',
      },
      inviteeEmail,
      role,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdAt: new Date().toISOString(),
    };

    this.invitations.push(newInvitation);
    return newInvitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = this.invitations.find(inv => inv.token === token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation is no longer valid');
    }
    
    // Update invitation status
    invitation.status = 'ACCEPTED';
    
    // Create NotePermission record in database
    const roleMapping = {
      'EDITOR': NoteRole.EDITOR,
      'VIEWER': NoteRole.VIEWER,
    };
    
    const noteRole = roleMapping[invitation.role] || NoteRole.VIEWER;
    
    // Check if permission already exists
    const existingPermission = await this.notePermissionRepository.findOne({
      where: {
        noteId: invitation.noteId,
        userId: userId,
      },
    });
    
    if (!existingPermission) {
      // Create new permission
      await this.notePermissionRepository.save({
        noteId: invitation.noteId,
        userId: userId,
        role: noteRole,
        grantedById: invitation.inviterId,
      });
      
    } else {
    }
    
    return { message: 'Invitation accepted successfully' };
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = this.invitations.find(inv => inv.token === token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation is no longer valid');
    }
    
    // Update invitation status
    invitation.status = 'DECLINED';
    
    return { message: 'Invitation declined' };
  }
}