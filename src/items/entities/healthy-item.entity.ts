import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '../../product-types/entities/product-type.entity';

@Entity('healthy_items')
export class HealthyItem {
  @ApiProperty({
    description: 'The unique identifier for the healthy item',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The title of the healthy item',
    example: 'Organic Green Tea',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Quantity in stock',
    example: 500,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({
    description: 'Color of the item',
    example: 'Green',
  })
  @Column()
  color: string;

  @ApiProperty({
    description: 'Selling price per unit',
    example: 25.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Original/cost price per unit',
    example: 15.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  main_price: number;

  @ApiProperty({
    description: 'QR code data URL for the item (generated on creation)',
    example: 'data:image/png;base64,...',
  })
  @Column({ type: 'text', nullable: true })
  qr_code: string;

  @ApiProperty({
    description: 'Image URL path for the item',
    example: '/public/uploads/items/healthy-item-1.jpg',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  image_url: string;

  @Column({ nullable: true })
  type_id?: number;

  @ApiProperty({
    description: 'Product type details',
    type: () => ProductType,
    nullable: true,
  })
  @ManyToOne(() => ProductType, (productType) => productType.healthyItems, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'type_id' })
  productType?: ProductType;

  @ApiProperty({
    description: 'The date and time when the item was created',
    example: '2026-03-31T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the item was last updated',
    example: '2026-03-31T10:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
