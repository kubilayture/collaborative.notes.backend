import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto, FolderResponseDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('folders')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Parent folder not found' })
  create(
    @Body() createFolderDto: CreateFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.foldersService.create(createFolderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all folders for the current user' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Filter by parent folder ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Folders retrieved successfully',
    type: [FolderResponseDto],
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.foldersService.findAll(userId, parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific folder' })
  @ApiResponse({
    status: 200,
    description: 'Folder retrieved successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.foldersService.findOne(id, userId);
  }

  @Get(':id/path')
  @ApiOperation({ summary: 'Get the full path to a folder' })
  @ApiResponse({
    status: 200,
    description: 'Folder path retrieved successfully',
    type: [FolderResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  getFolderPath(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.foldersService.getFolderPath(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Cannot modify system folders' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.foldersService.update(id, updateFolderDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete system folders' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.foldersService.remove(id, userId);
  }
}
