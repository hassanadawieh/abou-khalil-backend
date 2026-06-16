import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { AccessToken } from '../../auth/entities/access-token.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'The unique identifier for the user',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The username of the user. Must be unique.',
    example: 'john_doe',
  })
  @Column({ unique: true })
  username: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '1234567890',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    description: 'The hashed password of the user',
    example: 'hashed_password_string',
  })
  @Column()
  password: string;

  @ApiHideProperty()
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ApiProperty({
    description: 'The ID of the role assigned to the user',
    example: 1,
  })
  @Column()
  role_id: number;

  @ApiHideProperty()
  @OneToMany(() => AccessToken, (accessToken) => accessToken.user)
  accessTokens: Promise<AccessToken[]>;

  @ApiProperty({
    description: 'The date and time when the user was created',
    example: '2026-03-24T21:55:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the user was last updated',
    example: '2026-03-24T21:55:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
