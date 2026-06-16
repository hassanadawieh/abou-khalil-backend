import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @ApiProperty({
    description: 'The unique identifier for the role',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the role (admin, superadmin, employee)',
    example: 'admin',
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Description of the role and its permissions',
    example: 'Administrator with full access',
    nullable: true,
  })
  @Column({ nullable: true })
  description: string;

  @ApiHideProperty()
  @OneToMany(() => User, (user) => user.role)
  users: Promise<User[]>;

  @ApiProperty({
    description: 'Permissions assigned to this role',
    type: () => [Permission],
  })
  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: false,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions?: Permission[];
}
