import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { Role } from '../roles/entities/role.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Create a new user with username, phone number, password, and role assignment',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Username already exists or invalid input',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users with their roles and details',
  })
  @ApiOkResponse({
    description: 'List of users retrieved successfully',
    type: [User],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The user ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update user information (username, phone number, password, or role)',
  })
  @ApiParam({
    name: 'id',
    description: 'The user ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID not found',
  })
  @ApiBadRequestResponse({
    description: 'Username already exists or invalid input',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Remove a user from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'The user ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      example: { message: 'User with ID 1 has been deleted' },
    },
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
