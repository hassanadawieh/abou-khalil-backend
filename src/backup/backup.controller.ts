import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { BackupService } from './backup.service';

@ApiTags('backup')
@Controller('backup')
@UseGuards(AuthTokenGuard, SuperAdminGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({
    summary: 'Download database backup',
    description:
      'Creates a gzipped SQL dump of the database. SuperAdmin only.',
  })
  @ApiOkResponse({
    description: 'Gzipped SQL backup file',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Caller is not superAdmin' })
  async download(@Res() res: Response): Promise<void> {
    const { buffer, filename } = await this.backupService.createBackup();

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
