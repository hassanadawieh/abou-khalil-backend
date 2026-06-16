import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { CustomerHistoryEntry } from './customer-history-entry.entity';

@Entity('customers')
export class Customer {
  @ApiProperty({
    description: 'The unique identifier for the customer',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The first name of the customer',
    example: 'John',
  })
  @Column()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the customer',
    example: 'Doe',
  })
  @Column()
  lastName: string;

  @ApiProperty({
    description: 'The primary phone number of the customer',
    example: '1234567890',
  })
  @Column()
  phoneNumber1: string;

  @ApiProperty({
    description: 'The secondary phone number of the customer (optional)',
    example: '0987654321',
    nullable: true,
  })
  @Column({ nullable: true })
  phoneNumber2?: string;

  @ApiProperty({
    description: 'The city where the customer is located',
    example: 'New York',
  })
  @Column()
  city: string;

  @ApiProperty({
    description: 'The amount associated with the customer',
    example: 1500.5,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'The date and time when the customer was created',
    example: '2026-03-31T11:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the customer was last updated',
    example: '2026-03-31T11:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiHideProperty()
  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Promise<Invoice[]>;

  @ApiHideProperty()
  @OneToMany(() => CustomerHistoryEntry, (entry) => entry.customer)
  historyEntries: Promise<CustomerHistoryEntry[]>;
}
