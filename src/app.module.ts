import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { FriendsModule } from './friends/friends.module';
import { MessagingModule } from './messaging/messaging.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    BetterAuthModule.forRoot(auth),
    AuthModule,
    UsersModule,
    NotesModule,
    FriendsModule,
    MessagingModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
