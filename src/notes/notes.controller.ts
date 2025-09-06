import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser } from '../auth';
import { NotesService } from './notes.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteResponseDto,
  NotesQueryDto,
  PaginatedNotesResponseDto,
} from './dto';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'The note has been successfully created',
    type: NoteResponseDto,
  })
  async create(
    @CurrentUser() user: any,
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(user.id, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes accessible to the user' })
  @ApiResponse({
    status: 200,
    description: 'List of notes',
    type: PaginatedNotesResponseDto,
  })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: NotesQueryDto,
  ): Promise<PaginatedNotesResponseDto> {
    return this.notesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 200,
    description: 'The note',
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this note',
  })
  async findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NoteResponseDto> {
    return this.notesService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully updated',
    type: NoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have edit access to this note',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, user.id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the owner can delete this note',
  })
  async remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.notesService.remove(id, user.id);
    return { message: 'Note deleted successfully' };
  }
}
