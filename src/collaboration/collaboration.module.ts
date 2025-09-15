import { Module } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}