import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Note, NotePermission, NoteRole, User } from '../entities';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NotesQueryDto,
  NoteResponseDto,
  PaginatedNotesResponseDto,
} from './dto';
import { UserResponseDto } from '../users/dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NotePermission)
    private readonly notePermissionRepository: Repository<NotePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    userId: string,
    createNoteDto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.noteRepository.save({
      ...createNoteDto,
      ownerId: userId,
      tags: createNoteDto.tags || [],
    });

    // Create owner permission
    await this.notePermissionRepository.save({
      noteId: note.id,
      userId,
      role: NoteRole.OWNER,
      grantedById: userId,
    });

    return this.findById(note.id, userId);
  }

  async findAll(
    userId: string,
    query: NotesQueryDto,
  ): Promise<PaginatedNotesResponseDto> {
    const {
      mine = true,
      shared = true,
      page = 1,
      limit = 10,
      search,
      tag,
    } = query;

    const queryBuilder = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.owner', 'owner')
      .leftJoin(
        'note_permissions',
        'permission',
        'permission.noteId = note.id',
      );

    // Apply access filters
    const conditions: string[] = [];

    if (mine) {
      conditions.push('note.ownerId = :userId');
    }

    if (shared) {
      conditions.push(
        '(permission.userId = :userId AND permission.role != :ownerRole)',
      );
    }

    if (conditions.length > 0) {
      queryBuilder.where(`(${conditions.join(' OR ')})`, {
        userId,
        ownerRole: NoteRole.OWNER,
      });
    } else {
      // If neither mine nor shared, return empty result
      queryBuilder.where('1 = 0');
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(note.title ILIKE :search OR note.content::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply tag filter
    if (tag) {
      queryBuilder.andWhere(':tag = ANY(note.tags)', { tag });
    }

    // Order by updated date (most recent first)
    queryBuilder.orderBy('note.updatedAt', 'DESC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [notes, total] = await queryBuilder.getManyAndCount();

    // Load permissions for all notes
    const noteIds = notes.map((note) => note.id);
    const permissions =
      noteIds.length > 0
        ? await this.notePermissionRepository
            .createQueryBuilder('permission')
            .leftJoinAndSelect('permission.user', 'user')
            .where('permission.noteId IN (:...noteIds)', { noteIds })
            .andWhere('permission.role != :ownerRole', {
              ownerRole: NoteRole.OWNER,
            })
            .getMany()
        : [];

    // Group permissions by note ID
    const permissionsByNoteId = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.noteId]) {
          acc[permission.noteId] = [];
        }
        acc[permission.noteId].push({
          id: permission.id,
          permission: permission.role === NoteRole.EDITOR ? 'WRITE' : 'READ',
          userId: permission.userId,
          grantedById: permission.grantedById || '',
          user: permission.user
            ? plainToClass(UserResponseDto, permission.user)
            : undefined,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    return plainToClass(PaginatedNotesResponseDto, {
      notes: notes.map((note) => {
        const result = plainToClass(NoteResponseDto, note);
        result.permissions = permissionsByNoteId[note.id] || [];
        return result;
      }),
      total,
      page,
      limit,
      pages,
      hasNext,
      hasPrev,
    });
  }

  async findById(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.owner', 'owner')
      .where('note.id = :id', { id })
      .getOne();

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check if user has access to this note
    if (note.ownerId !== userId) {
      const permission = await this.notePermissionRepository.findOne({
        where: { noteId: id, userId },
      });

      if (!permission && !note.isPublic) {
        throw new ForbiddenException('Access denied to this note');
      }
    }

    // Load permissions with user details (excluding owner permissions)
    const permissions = await this.notePermissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.user', 'user')
      .where('permission.noteId = :noteId', { noteId: id })
      .andWhere('permission.role != :ownerRole', { ownerRole: NoteRole.OWNER })
      .getMany();

    const result = plainToClass(NoteResponseDto, note);
    result.permissions = permissions.map((permission) => ({
      id: permission.id,
      permission: permission.role === NoteRole.EDITOR ? 'WRITE' : 'READ',
      userId: permission.userId,
      grantedById: permission.grantedById || '',
      user: permission.user
        ? plainToClass(UserResponseDto, permission.user)
        : undefined,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));

    return result;
  }

  async update(
    id: string,
    userId: string,
    updateNoteDto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({ where: { id } });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check if user has edit access
    if (note.ownerId !== userId) {
      const permission = await this.notePermissionRepository.findOne({
        where: { noteId: id, userId },
      });

      if (
        !permission ||
        ![NoteRole.OWNER, NoteRole.EDITOR].includes(permission.role)
      ) {
        throw new ForbiddenException(
          'You do not have edit access to this note',
        );
      }
    }

    await this.noteRepository.update(id, updateNoteDto);

    return this.findById(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.noteRepository.findOne({ where: { id } });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Only owner can delete the note
    if (note.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this note');
    }

    await this.noteRepository.remove(note);
  }

  async checkAccess(noteId: string, userId: string): Promise<NoteRole | null> {
    const note = await this.noteRepository.findOne({ where: { id: noteId } });

    if (!note) {
      return null;
    }

    if (note.ownerId === userId) {
      return NoteRole.OWNER;
    }

    if (note.isPublic) {
      return NoteRole.VIEWER;
    }

    const permission = await this.notePermissionRepository.findOne({
      where: { noteId, userId },
    });

    return permission?.role || null;
  }

  async hasEditAccess(noteId: string, userId: string): Promise<boolean> {
    const role = await this.checkAccess(noteId, userId);
    return role !== null && [NoteRole.OWNER, NoteRole.EDITOR].includes(role);
  }

  async hasViewAccess(noteId: string, userId: string): Promise<boolean> {
    const role = await this.checkAccess(noteId, userId);
    return role !== null;
  }

  async moveNote(
    noteId: string,
    userId: string,
    folderId?: string | null,
  ): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({ where: { id: noteId } });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Check if user has edit access
    if (!(await this.hasEditAccess(noteId, userId))) {
      throw new ForbiddenException('You do not have edit access to this note');
    }

    // If folderId is provided, validate that the folder exists and belongs to the user
    if (folderId) {
      // Note: This would require importing the FoldersService
      // For now, we'll just update the note. The folder validation should be done
      // at the controller level or we need to inject FoldersService
    }

    await this.noteRepository.update(noteId, {
      folderId: folderId ?? undefined,
    });
    return this.findById(noteId, userId);
  }

  async updateContent(
    noteId: string,
    content: string,
    userId?: string,
  ): Promise<void> {
    const note = await this.noteRepository.findOne({ where: { id: noteId } });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // If userId is provided, check edit access
    if (userId && !(await this.hasEditAccess(noteId, userId))) {
      throw new ForbiddenException('You do not have edit access to this note');
    }

    // Convert string content to the expected JSON format
    let contentJson: Record<string, any> | null;
    try {
      // Try to parse as JSON first
      contentJson = JSON.parse(content);
    } catch {
      // If it's not JSON, store as plain text in a structured format
      contentJson = { text: content };
    }

    await this.noteRepository.update(noteId, { content: contentJson });
  }
}
