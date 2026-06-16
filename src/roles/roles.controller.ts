import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('roles')
@Controller('roles')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all roles',
    description:
      'Retrieve a list of all available roles in the system (admin, superadmin, employee)',
  })
  @ApiOkResponse({
    description: 'List of roles retrieved successfully',
    type: [Role],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Role[]> {
    return this.rolesService.findAll();
  }
}
