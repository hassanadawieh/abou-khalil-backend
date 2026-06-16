import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('access_tokens')
export class AccessToken {
  @ApiProperty({
    description: 'The unique identifier for the access token',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The token string used for authenticating API requests',
    example: '6d7f7f4fd7ef5f7eae4a24bd4d068f0b8df0f597f676a6d6',
  })
  @Column({ unique: true, type: 'text' })
  token: string;

  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'The ID of the user who owns this token',
    example: 1,
  })
  @Column()
  user_id: number;

  @ApiProperty({
    description: 'The date and time when the token was created',
    example: '2026-03-25T11:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
