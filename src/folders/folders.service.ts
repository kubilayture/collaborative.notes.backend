import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Folder } from './folder.entity';
import { CreateFolderDto, UpdateFolderDto, FolderResponseDto } from './dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly foldersRepository: Repository<Folder>,
  ) {}

  async create(
    createFolderDto: CreateFolderDto,
    userId: string,
  ): Promise<FolderResponseDto> {
    // Check if parent folder exists and belongs to user
    if (createFolderDto.parentId) {
      const parentFolder = await this.foldersRepository.findOne({
        where: { id: createFolderDto.parentId, ownerId: userId },
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    // Check for duplicate folder names in the same parent
    const existingFolder = await this.foldersRepository.findOne({
      where: createFolderDto.parentId
        ? {
            name: createFolderDto.name,
            ownerId: userId,
            parentId: createFolderDto.parentId,
          }
        : {
            name: createFolderDto.name,
            ownerId: userId,
            parentId: IsNull(),
          },
    });

    if (existingFolder) {
      throw new BadRequestException(
        'A folder with this name already exists in this location',
      );
    }

    const folder = this.foldersRepository.create({
      ...createFolderDto,
      ownerId: userId,
    });

    const savedFolder = await this.foldersRepository.save(folder);
    return this.mapToResponseDto(savedFolder);
  }

  async findAll(
    userId: string,
    parentId?: string,
  ): Promise<FolderResponseDto[]> {
    const queryBuilder = this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoin('notes', 'note', 'note.folderId = folder.id')
      .leftJoin('folders', 'subfolder', 'subfolder.parentId = folder.id')
      .select([
        'folder.id',
        'folder.name',
        'folder.description',
        'folder.color',
        'folder.ownerId',
        'folder.parentId',
        'folder.isSystem',
        'folder.createdAt',
        'folder.updatedAt',
        'COUNT(DISTINCT note.id) as noteCount',
        'COUNT(DISTINCT subfolder.id) as subfolderCount',
      ])
      .where('folder.ownerId = :userId', { userId })
      .groupBy('folder.id')
      .orderBy('folder.name', 'ASC');

    if (parentId !== undefined) {
      queryBuilder.andWhere('folder.parentId = :parentId', { parentId });
    } else {
      queryBuilder.andWhere('folder.parentId IS NULL');
    }

    const folders = await queryBuilder.getRawMany();

    return folders.map((folder) => ({
      id: folder.folder_id,
      name: folder.folder_name,
      description: folder.folder_description,
      color: folder.folder_color,
      ownerId: folder.folder_ownerId,
      parentId: folder.folder_parentId,
      isSystem: folder.folder_isSystem,
      createdAt: folder.folder_createdAt,
      updatedAt: folder.folder_updatedAt,
      noteCount: parseInt(folder.notecount) || 0,
      subfolderCount: parseInt(folder.subfoldercount) || 0,
    }));
  }

  async findOne(id: string, userId: string): Promise<FolderResponseDto> {
    const folder = await this.foldersRepository
      .createQueryBuilder('folder')
      .leftJoin('notes', 'note', 'note.folderId = folder.id')
      .leftJoin('folders', 'subfolder', 'subfolder.parentId = folder.id')
      .select([
        'folder.*',
        'COUNT(DISTINCT note.id) as noteCount',
        'COUNT(DISTINCT subfolder.id) as subfolderCount',
      ])
      .where('folder.id = :id', { id })
      .andWhere('folder.ownerId = :userId', { userId })
      .groupBy('folder.id')
      .getRawOne();

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return {
      id: folder.folder_id,
      name: folder.folder_name,
      description: folder.folder_description,
      color: folder.folder_color,
      ownerId: folder.folder_ownerId,
      parentId: folder.folder_parentId,
      isSystem: folder.folder_isSystem,
      createdAt: folder.folder_createdAt,
      updatedAt: folder.folder_updatedAt,
      noteCount: parseInt(folder.notecount) || 0,
      subfolderCount: parseInt(folder.subfoldercount) || 0,
    };
  }

  async update(
    id: string,
    updateFolderDto: UpdateFolderDto,
    userId: string,
  ): Promise<FolderResponseDto> {
    const folder = await this.foldersRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.isSystem) {
      throw new ForbiddenException('Cannot modify system folders');
    }

    // Check if moving to a parent that would create a cycle
    if (
      updateFolderDto.parentId &&
      updateFolderDto.parentId !== folder.parentId
    ) {
      const isDescendant = await this.isDescendantOf(
        updateFolderDto.parentId,
        id,
      );
      if (isDescendant || updateFolderDto.parentId === id) {
        throw new BadRequestException(
          'Cannot move folder to its own descendant',
        );
      }

      // Check if parent exists and belongs to user
      const parentFolder = await this.foldersRepository.findOne({
        where: { id: updateFolderDto.parentId, ownerId: userId },
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    // Check for duplicate names if name is being changed
    if (updateFolderDto.name && updateFolderDto.name !== folder.name) {
      const existingFolder = await this.foldersRepository.findOne({
        where: {
          name: updateFolderDto.name,
          ownerId: userId,
          parentId: updateFolderDto.parentId ?? folder.parentId,
        },
      });

      if (existingFolder && existingFolder.id !== id) {
        throw new BadRequestException(
          'A folder with this name already exists in this location',
        );
      }
    }

    Object.assign(folder, updateFolderDto);
    const savedFolder = await this.foldersRepository.save(folder);
    return this.mapToResponseDto(savedFolder);
  }

  async remove(id: string, userId: string): Promise<void> {
    const folder = await this.foldersRepository.findOne({
      where: { id, ownerId: userId },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.isSystem) {
      throw new ForbiddenException('Cannot delete system folders');
    }

    await this.foldersRepository.remove(folder);
  }

  async getFolderPath(
    folderId: string,
    userId: string,
  ): Promise<FolderResponseDto[]> {
    const path: FolderResponseDto[] = [];
    let currentId: string | undefined = folderId;

    while (currentId) {
      const folder = await this.foldersRepository.findOne({
        where: { id: currentId, ownerId: userId },
      });

      if (!folder) {
        break;
      }

      path.unshift(this.mapToResponseDto(folder));
      currentId = folder.parentId || undefined;
    }

    return path;
  }

  private async isDescendantOf(
    potentialAncestorId: string,
    folderId: string,
  ): Promise<boolean> {
    const descendants = await this.foldersRepository
      .createQueryBuilder('folder')
      .where('folder.parentId = :folderId', { folderId })
      .getMany();

    for (const descendant of descendants) {
      if (descendant.id === potentialAncestorId) {
        return true;
      }
      if (await this.isDescendantOf(potentialAncestorId, descendant.id)) {
        return true;
      }
    }

    return false;
  }

  private mapToResponseDto(folder: Folder): FolderResponseDto {
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      color: folder.color,
      ownerId: folder.ownerId,
      parentId: folder.parentId,
      isSystem: folder.isSystem,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}
