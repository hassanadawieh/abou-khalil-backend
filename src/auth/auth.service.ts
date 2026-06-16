import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AccessToken } from './entities/access-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(AccessToken)
    private readonly accessTokensRepository: Repository<AccessToken>,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = randomBytes(48).toString('hex');

    const tokenEntity = this.accessTokensRepository.create({
      token: accessToken,
      user_id: user.id,
    });

    await this.accessTokensRepository.save(tokenEntity);

    return { accessToken };
  }

  extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    return token;
  }

  async validateAccessToken(token: string): Promise<AccessToken> {
    const accessToken = await this.accessTokensRepository.findOne({
      where: { token },
      relations: ['user', 'user.role'],
    });

    if (!accessToken) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return accessToken;
  }

  async logout(token: string): Promise<{ message: string }> {
    const deleteResult = await this.accessTokensRepository.delete({ token });

    if (!deleteResult.affected) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return { message: 'Logged out successfully' };
  }
}
