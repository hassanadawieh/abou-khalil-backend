import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesService } from './roles/roles.service';
import { PermissionSeeder } from './database/seeders/permission.seeder';
import { getDataSourceToken } from '@nestjs/typeorm';

async function seed() {
  const app = await NestFactory.create(AppModule);
  const rolesService = app.get(RolesService);
  const permissionSeeder = app.get(PermissionSeeder);
  const dataSource = app.get(getDataSourceToken());

  try {
    // Ensure synchronization is run to create tables
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Run migrations/sync
    await dataSource.synchronize();

    const roles = [
      {
        name: 'admin',
        description: 'Administrator with no default permissions',
      },
      {
        name: 'superAdmin',
        description: 'Super Administrator with full system access',
      },
      { name: 'employee', description: 'Employee with limited access' },
    ];

    for (const role of roles) {
      const existingRole = await rolesService.findByName(role.name);
      if (!existingRole) {
        await rolesService.create(role.name, role.description);
        console.log(`✓ Role '${role.name}' created successfully`);
      } else {
        console.log(`✓ Role '${role.name}' already exists`);
      }
    }

    // Seed permissions and assign to roles
    console.log('\n--- Seeding Permissions ---');
    await permissionSeeder.seed();

    console.log('\n✓ Seed completed successfully');
    await app.close();
  } catch (error) {
    console.error('Seed failed:', error);
    await app.close();
    process.exit(1);
  }
}

void seed();
