import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { Folder } from './folder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Folder])],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
