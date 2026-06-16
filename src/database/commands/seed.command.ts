import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { PermissionSeeder } from '../seeders/permission.seeder';

@Injectable()
export class SeedCommand {
  constructor(private readonly permissionSeeder: PermissionSeeder) {}

  @Command({
    command: 'seed:permissions',
    describe: 'Seed all permissions and assign to roles',
  })
  async seedPermissions() {
    try {
      await this.permissionSeeder.seed();
    } catch (error) {
      console.error('Error seeding permissions:', error);
      throw error;
    }
  }
}
