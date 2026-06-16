import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthTokenGuard } from './guards/auth-token.guard';
import type { AuthenticatedRequest } from './guards/auth-token.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description:
      'Validate user credentials, generate and store a new access token, and return it',
  })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'generated_access_token',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description:
      'Remove the current access token from storage and invalidate it immediately',
  })
  @ApiOkResponse({
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  async logout(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    return this.authService.logout(req.accessToken as string);
  }

  @Get('me')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the currently authenticated user based on the stored access token',
  })
  @ApiOkResponse({
    description: 'Current user retrieved successfully',
    type: User,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  getCurrentUser(@Req() req: AuthenticatedRequest): User {
    return req.user as User;
  }
}
