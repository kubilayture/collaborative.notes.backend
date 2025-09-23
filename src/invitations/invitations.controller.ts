import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { InvitationsService } from './invitations.service';
import { CreateBulkInvitationsDto, CreateInvitationDto } from './dto';

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invitations for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of invitations retrieved successfully',
  })
  async getMyInvitations(@Request() req: any) {
    return await this.invitationsService.getMyInvitations(req.user.id);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get all sent invitations for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of sent invitations retrieved successfully',
  })
  async getMySentInvitations(@Request() req: any) {
    return await this.invitationsService.getMySentInvitations(req.user.id);
  }

  @Get('note/:noteId')
  @ApiOperation({ summary: 'Get all invitations for a specific note' })
  @ApiResponse({
    status: 200,
    description: 'List of note invitations retrieved successfully',
  })
  async getInvitationsForNote(
    @Request() req: any,
    @Param('noteId') noteId: string,
  ) {
    return await this.invitationsService.getInvitationsForNote(
      noteId,
      req.user.id,
    );
  }

  @Get('note/:noteId/sharing-info')
  @ApiOperation({
    summary:
      'Get sharing information (invitations and permissions) for a specific note',
  })
  @ApiResponse({
    status: 200,
    description: 'Note sharing information retrieved successfully',
  })
  async getSharingInfoForNote(
    @Request() req: any,
    @Param('noteId') noteId: string,
  ) {
    return await this.invitationsService.getSharingInfoForNote(
      noteId,
      req.user.id,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invitation for a note' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  async create(@Request() req: any, @Body() body: CreateInvitationDto) {
    const { noteId, inviteeEmail, role } = body;
    return await this.invitationsService.createInvitation(
      req.user.id,
      noteId,
      inviteeEmail,
      role,
      undefined, // noteTitle
      req.user.name,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple invitations for a note' })
  @ApiResponse({
    status: 201,
    description: 'Bulk invitations processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'number',
          description: 'Number of successful invitations',
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
        created: { type: 'array', description: 'Created invitation objects' },
      },
    },
  })
  async createBulk(
    @Request() req: any,
    @Body() body: CreateBulkInvitationsDto,
  ) {
    const { noteId, invitations } = body;
    return await this.invitationsService.createBulkInvitations(
      req.user.id,
      noteId,
      invitations,
      req.user.name,
    );
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  async accept(@Request() req: any, @Param('token') token: string) {
    return await this.invitationsService.acceptInvitation(token, req.user.id);
  }

  @Post(':token/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  async decline(@Request() req: any, @Param('token') token: string) {
    return await this.invitationsService.declineInvitation(token, req.user.id);
  }

  @Delete(':invitationId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a sent invitation' })
  @ApiResponse({ status: 204, description: 'Invitation cancelled successfully' })
  @ApiResponse({
    status: 404,
    description: 'Invitation not found or not pending',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot cancel invitation that you did not send',
  })
  async cancel(@Request() req: any, @Param('invitationId') invitationId: string) {
    return await this.invitationsService.cancelInvitation(invitationId, req.user.id);
  }
}
