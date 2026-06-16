import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Customer } from './customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum CustomerHistoryEntryType {
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  ADJUSTMENT = 'adjustment',
}

@Entity('customer_history_entries')
export class CustomerHistoryEntry {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column()
  customer_id: number;

  @ApiHideProperty()
  @ManyToOne(() => Customer, (customer) => customer.historyEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({ enum: CustomerHistoryEntryType })
  @Column({ type: 'enum', enum: CustomerHistoryEntryType })
  type: CustomerHistoryEntryType;

  @ApiProperty({
    description:
      'Signed amount. Positive increases customer balance, negative decreases it.',
    example: 125.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ required: false, nullable: true, example: 'دفعة نقدية' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 15 })
  @Column({ nullable: true })
  invoice_id?: number | null;

  @ApiHideProperty()
  @ManyToOne(() => Invoice, {
    nullable: true,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice | null;

  @ApiProperty({ example: '2026-05-05T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}
