import {
  Controller,
  Get,
  Post,
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

  @Post()
  @ApiOperation({ summary: 'Create a new invitation for a note' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  async create(@Request() req: any, @Body() body: any) {
    const { noteId, inviteeEmail, role, noteTitle } = body;
    return await this.invitationsService.createInvitation(
      req.user.id,
      noteId,
      inviteeEmail,
      role,
      noteTitle,
      req.user.name,
      req.user.email,
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
}
