import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    const username = process.env.SEED_ADMIN_USERNAME || 'hassan';
    const password = process.env.SEED_ADMIN_PASSWORD || 'P@ssw0rd';
    const phoneNumber = process.env.SEED_ADMIN_PHONE || '0000000000';

    const existingUser = await this.userRepository.findOneBy({ username });

    if (existingUser) {
      console.log(`User '${username}' already exists — skipping`);
      return;
    }

    const superAdminRole = await this.roleRepository.findOneBy({
      name: 'superAdmin',
    });

    if (!superAdminRole) {
      throw new Error(
        'superAdmin role not found. Seed roles before seeding users.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      phoneNumber,
      password: hashedPassword,
      role_id: superAdminRole.id,
    });

    await this.userRepository.save(user);
    console.log(`Created default superAdmin user: ${username}`);
  }
}
