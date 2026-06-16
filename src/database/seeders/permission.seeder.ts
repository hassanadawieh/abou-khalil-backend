import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import {
  Permission,
  PermissionAction,
} from '../../roles/entities/permission.entity';

@Injectable()
export class PermissionSeeder {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed() {
    console.log('Starting permission seeder...');

    const existingCount = await this.permissionRepository.count();
    if (existingCount > 0) {
      console.log(
        `${existingCount} permissions already exist — syncing role assignments only`,
      );

      const allPermissions = await this.permissionRepository.find();
      const superAdminRole = await this.roleRepository.findOneBy({
        name: 'superAdmin',
      });
      const adminRole = await this.roleRepository.findOneBy({ name: 'admin' });

      if (superAdminRole) {
        superAdminRole.permissions = allPermissions;
        await this.roleRepository.save(superAdminRole);
        console.log(
          `Assigned ${allPermissions.length} permissions to superAdmin role`,
        );
      }

      if (adminRole) {
        adminRole.permissions = [];
        await this.roleRepository.save(adminRole);
        console.log('Admin role has no permissions by default');
      }

      console.log('Permission seeder completed successfully!');
      return;
    }

    // Define all resources that need permissions
    const resources = [
      'users',
      'roles',
      'employees',
      'customers',
      'suppliers',
      'items',
      'invoices',
      'balance',
    ];

    const actions = [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ];

    // Create all permissions
    const permissionsToCreate: Permission[] = [];
    const permissionMap = new Map<string, Permission>();

    for (const resource of resources) {
      for (const action of actions) {
        const permission = this.permissionRepository.create({
          resource,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
        });
        permissionsToCreate.push(permission);
        permissionMap.set(`${resource}:${action}`, permission);
      }
    }

    // Save all permissions
    const savedPermissions = await this.permissionRepository.save(
      permissionsToCreate,
    );
    console.log(`Created ${savedPermissions.length} permissions`);

    // Get or create roles
    let superAdminRole = await this.roleRepository.findOneBy({
      name: 'superAdmin',
    });
    let adminRole = await this.roleRepository.findOneBy({ name: 'admin' });

    if (!superAdminRole) {
      superAdminRole = this.roleRepository.create({
        name: 'superAdmin',
        description: 'Super Administrator with all permissions',
      });
      superAdminRole = await this.roleRepository.save(superAdminRole);
      console.log('Created superAdmin role');
    }

    if (!adminRole) {
      adminRole = this.roleRepository.create({
        name: 'admin',
        description: 'Administrator with no default permissions',
      });
      adminRole = await this.roleRepository.save(adminRole);
      console.log('Created admin role');
    }

    // Assign all permissions to superAdmin
    superAdminRole.permissions = savedPermissions;
    await this.roleRepository.save(superAdminRole);
    console.log(
      `Assigned ${savedPermissions.length} permissions to superAdmin role`,
    );

    // Ensure admin role has no permissions (set to empty array)
    adminRole.permissions = [];
    await this.roleRepository.save(adminRole);
    console.log('Admin role has no permissions by default');

    console.log('Permission seeder completed successfully!');
  }
}
