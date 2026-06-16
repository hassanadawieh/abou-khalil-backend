import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('employees')
export class Employee {
  @ApiProperty({
    description: 'The unique identifier for the employee',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the employee',
    example: 'John Doe',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'The phone number of the employee',
    example: '1234567890',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    description: 'The salary of the employee',
    example: 5000,
  })
  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;

  @ApiProperty({
    description: 'The date and time when the employee was created',
    example: '2026-03-31T11:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the employee was last updated',
    example: '2026-03-31T11:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
