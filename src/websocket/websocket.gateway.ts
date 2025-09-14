import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotesService } from '../notes/notes.service';
import { MessagingService } from '../messaging/messaging.service';
import { PresenceService } from './presence.service';
import { auth } from '../lib/auth';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

interface NoteCollaborationData {
  noteId: string;
  content: string;
  userId: string;
  timestamp: Date;
}

interface MessageData {
  threadId: string;
  content: string;
  userId: string;
  replyToId?: string;
}

interface TypingData {
  threadId: string;
  userId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]
  private noteRooms = new Map<string, Set<string>>(); // noteId -> Set<userId>
  private threadRooms = new Map<string, Set<string>>(); // threadId -> Set<userId>

  constructor(
    private readonly notesService: NotesService,
    private readonly messagingService: MessagingService,
    private readonly presenceService: PresenceService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract session from socket handshake
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        client.disconnect();
        return;
      }

      // Parse session cookie and validate with BetterAuth
      const headers = new Headers();
      headers.append('cookie', cookies);
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        this.logger.warn(`Connection rejected - no valid session`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.user = session.user;

      // Track user sockets
      const userId = session.user.id;
      const isFirstConnection = !this.userSockets.has(userId);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);

      // Join a personal room for cross-gateway notifications
      await client.join(`user:${userId}`);

      // Update presence only on first connection
      if (isFirstConnection) {
        await this.presenceService.setUserOnline(userId);
        client.broadcast.emit('user:online', { userId });
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${session.user.email})`,
      );
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const userId = client.user.id;
      const userSocketIds = this.userSockets.get(userId) || [];
      const updatedSockets = userSocketIds.filter((id) => id !== client.id);

      if (updatedSockets.length === 0) {
        this.userSockets.delete(userId);
        // User is completely offline
        await this.presenceService.setUserOffline(userId);
        client.broadcast.emit('user:offline', { userId });
      } else {
        this.userSockets.set(userId, updatedSockets);
      }

      // Leave all rooms
      this.leaveAllRooms(client, userId);

      this.logger.log(
        `Client disconnected: ${client.id} (User: ${client.user.email})`,
      );
    }
  }

  // Note collaboration events
  @SubscribeMessage('note:join')
  async handleJoinNote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string },
  ) {
    if (!client.user) return;

    try {
      // Check if user has access to the note
      await this.notesService.findById(data.noteId, client.user.id);

      // Join note room
      const roomName = `note:${data.noteId}`;
      await client.join(roomName);

      // Track user in note room
      if (!this.noteRooms.has(data.noteId)) {
        this.noteRooms.set(data.noteId, new Set());
      }
      this.noteRooms.get(data.noteId)!.add(client.user.id);

      // Notify others in the room
      client.to(roomName).emit('note:user-joined', {
        noteId: data.noteId,
        user: {
          id: client.user.id,
          name: client.user.name,
          email: client.user.email,
        },
      });

      // Send current collaborators to the joining user
      const collaborators = Array.from(this.noteRooms.get(data.noteId)!);
      client.emit('note:collaborators', {
        noteId: data.noteId,
        collaborators,
      });

      this.logger.log(`User ${client.user.email} joined note ${data.noteId}`);
    } catch (error) {
      client.emit('error', {
        message: 'Failed to join note',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('note:leave')
  handleLeaveNote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string },
  ) {
    if (!client.user) return;

    const roomName = `note:${data.noteId}`;
    void client.leave(roomName);

    // Remove from note room tracking
    this.noteRooms.get(data.noteId)?.delete(client.user.id);

    // Notify others
    client.to(roomName).emit('note:user-left', {
      noteId: data.noteId,
      userId: client.user.id,
    });

    this.logger.log(`User ${client.user.email} left note ${data.noteId}`);
  }

  @SubscribeMessage('note:content-change')
  handleNoteContentChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: NoteCollaborationData,
  ) {
    if (!client.user) return;

    try {
      // Broadcast content change to all other users in the note room
      const roomName = `note:${data.noteId}`;
      client.to(roomName).emit('note:content-changed', {
        noteId: data.noteId,
        content: data.content,
        userId: client.user.id,
        timestamp: new Date(),
      });

      // Note: Content is not persisted here - that should be done via REST API
      // This is just for real-time collaboration sync
    } catch (error) {
      client.emit('error', {
        message: 'Failed to sync content change',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('note:cursor-position')
  handleCursorPosition(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      noteId: string;
      position: number;
      selection?: { start: number; end: number };
    },
  ) {
    if (!client.user) return;

    const roomName = `note:${data.noteId}`;
    client.to(roomName).emit('note:cursor-moved', {
      noteId: data.noteId,
      userId: client.user.id,
      position: data.position,
      selection: data.selection,
      user: {
        id: client.user.id,
        name: client.user.name,
      },
    });
  }

  // Messaging events
  @SubscribeMessage('thread:join')
  async handleJoinThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.user) return;

    try {
      // Check if user has access to the thread
      await this.messagingService.getThreadById(data.threadId, client.user.id);

      // Join thread room
      const roomName = `thread:${data.threadId}`;
      await client.join(roomName);

      // Track user in thread room
      if (!this.threadRooms.has(data.threadId)) {
        this.threadRooms.set(data.threadId, new Set());
      }
      this.threadRooms.get(data.threadId)!.add(client.user.id);

      this.logger.log(
        `User ${client.user.email} joined thread ${data.threadId}`,
      );
    } catch (error) {
      client.emit('error', {
        message: 'Failed to join thread',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('thread:leave')
  handleLeaveThread(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.user) return;

    const roomName = `thread:${data.threadId}`;
    void client.leave(roomName);

    // Remove from thread room tracking
    this.threadRooms.get(data.threadId)?.delete(client.user.id);

    this.logger.log(`User ${client.user.email} left thread ${data.threadId}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: MessageData,
  ) {
    if (!client.user) return;

    try {
      // Send message via service
      const message = await this.messagingService.sendMessage(
        client.user.id,
        data.threadId,
        {
          content: data.content,
          replyToId: data.replyToId,
        },
      );

      // Broadcast new message to thread room
      const roomName = `thread:${data.threadId}`;
      this.server.to(roomName).emit('message:new', message);

      this.logger.log(
        `Message sent in thread ${data.threadId} by ${client.user.email}`,
      );
    } catch (error) {
      client.emit('error', {
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingData,
  ) {
    if (!client.user) return;

    const roomName = `thread:${data.threadId}`;
    client.to(roomName).emit('message:typing', {
      threadId: data.threadId,
      userId: client.user.id,
      user: {
        id: client.user.id,
        name: client.user.name,
      },
      isTyping: data.isTyping,
    });
  }

  // Utility methods
  private leaveAllRooms(client: AuthenticatedSocket, userId: string) {
    // Remove from note rooms
    for (const [noteId, users] of this.noteRooms) {
      if (users.has(userId)) {
        users.delete(userId);
        client.to(`note:${noteId}`).emit('note:user-left', { noteId, userId });
      }
    }

    // Remove from thread rooms
    for (const [threadId, users] of this.threadRooms) {
      if (users.has(userId)) {
        users.delete(userId);
      }
    }
  }

  // Public methods for other services to emit events
  emitToUser(userId: string, event: string, data: any) {
    // Emit to the user's personal room
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToNoteRoom(noteId: string, event: string, data: any) {
    this.server.to(`note:${noteId}`).emit(event, data);
  }

  emitToThreadRoom(threadId: string, event: string, data: any) {
    this.server.to(`thread:${threadId}`).emit(event, data);
  }
}
