import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('suppliers')
export class Supplier {
  @ApiProperty({
    description: 'The unique identifier for the supplier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the supplier',
    example: 'Acme Supplies Inc.',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'The phone number of the supplier',
    example: '5551234567',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    description: 'The amount owed or in account',
    example: 50000.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'The date and time when the supplier was created',
    example: '2026-03-31T11:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the supplier was last updated',
    example: '2026-03-31T11:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
