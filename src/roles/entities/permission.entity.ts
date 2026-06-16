import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('permissions')
export class Permission {
  @ApiProperty({
    description: 'The unique identifier for the permission',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The resource this permission applies to (e.g., users, items, invoices)',
    example: 'users',
  })
  @Column()
  resource: string;

  @ApiProperty({
    description: 'The action allowed on this resource',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  @Column({ type: 'enum', enum: PermissionAction })
  action: PermissionAction;

  @ApiProperty({
    description: 'Human-readable description of the permission',
    example: 'Can create new users',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Roles that have this permission',
    type: () => [Role],
  })
  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];

  @ApiProperty({
    description: 'The date and time when the permission was created',
    example: '2026-04-01T12:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the permission was last updated',
    example: '2026-04-01T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
