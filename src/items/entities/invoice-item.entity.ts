import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { CeramicItem } from './ceramic-item.entity';
import { HealthyItem } from './healthy-item.entity';

export enum ItemType {
  CERAMIC = 'ceramic',
  HEALTHY = 'healthy',
}

@Entity('invoice_items')
export class InvoiceItem {
  @ApiProperty({
    description: 'The unique identifier for the invoice item',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiHideProperty()
  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ApiProperty({
    description: 'The invoice ID',
    example: 1,
  })
  @Column()
  invoice_id: number;

  @ApiProperty({
    enum: ItemType,
    description: 'Type of item: ceramic or healthy',
    example: ItemType.CERAMIC,
  })
  @Column({
    type: 'enum',
    enum: ItemType,
  })
  item_type: ItemType;

  @ApiProperty({
    description: 'The ID of the ceramic item (if item_type is ceramic)',
    example: 1,
    nullable: true,
  })
  @Column({ nullable: true })
  ceramic_item_id?: number;

  @ApiHideProperty()
  @ManyToOne(() => CeramicItem, { eager: false })
  @JoinColumn({ name: 'ceramic_item_id' })
  ceramicItem?: CeramicItem;

  @ApiProperty({
    description: 'The ID of the healthy item (if item_type is healthy)',
    example: 1,
    nullable: true,
  })
  @Column({ nullable: true })
  healthy_item_id?: number;

  @ApiHideProperty()
  @ManyToOne(() => HealthyItem, { eager: false })
  @JoinColumn({ name: 'healthy_item_id' })
  healthyItem?: HealthyItem;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 4,
  })
  @Column()
  quantity: number;

  @ApiProperty({
    description: 'Optional place/location for the item within the warehouse',
    example: 'مخزن A - رف 3',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  place?: string;
}
