import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../customers/entities/customer.entity';
import { InvoiceItem } from '../../items/entities/invoice-item.entity';

export enum InvoiceType {
  CERAMIC = 'ceramic',
  HEALTHY = 'healthy',
}

@Entity('invoices')
export class Invoice {
  @ApiProperty({
    description: 'The unique identifier for the invoice',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Unique invoice number starting with AKC',
    example: 'AKC-000001',
  })
  @Column({ unique: true })
  invoice_number: string;

  @ApiProperty({
    description: 'Sum of all items amount',
    example: 1500.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Discount applied to the invoice',
    example: 100,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({
    description: 'Delivery price (optional)',
    example: 50,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  delivery_price: number;

  @ApiProperty({
    description:
      'Total amount after discount and delivery (amount - discount + delivery_price)',
    example: 1450.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @ApiProperty({
    description: 'Items included in this invoice with all item details',
    type: [InvoiceItem],
  })
  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.invoice, {
    eager: false,
  })
  items: InvoiceItem[];

  @ApiProperty({
    description: 'Type of invoice (ceramic or healthy)',
    enum: InvoiceType,
    example: InvoiceType.CERAMIC,
  })
  @Column({ type: 'enum', enum: InvoiceType })
  type: InvoiceType;

  @Column()
  customer_id: number;

  @ApiProperty({
    description: 'Customer details for this invoice',
    type: () => Customer,
  })
  @ManyToOne(() => Customer, (customer) => customer.invoices, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({
    description: 'The date and time when the invoice was created',
    example: '2026-03-31T12:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the invoice was last updated',
    example: '2026-03-31T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
