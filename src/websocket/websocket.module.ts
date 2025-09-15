import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationGateway } from './websocket.gateway';
import { PresenceService } from './presence.service';
import { NotesModule } from '../notes/notes.module';
import { MessagingModule } from '../messaging/messaging.module';
import { UserProfile } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    NotesModule,
    forwardRef(() => MessagingModule),
  ],
  providers: [CollaborationGateway, PresenceService],
  exports: [CollaborationGateway, PresenceService],
})
export class WebSocketModule {}
