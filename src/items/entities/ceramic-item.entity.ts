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

@Entity('ceramic_items')
export class CeramicItem {
  @ApiProperty({
    description: 'The unique identifier for the ceramic item',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The title of the ceramic item',
    example: 'White Ceramic Plate',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Quantity in stock',
    example: 100,
  })
  @Column()
  quantity: number;

  @ApiProperty({
    description: 'Bag size/type',
    example: 'Large',
  })
  @Column()
  bag: string;

  @ApiProperty({
    description: 'Quantity per bag',
    example: 10,
  })
  @Column()
  bag_quantity: number;

  @ApiProperty({
    description: 'Width in cm',
    example: 25,
  })
  @Column()
  width: number;

  @ApiProperty({
    description: 'Height in cm',
    example: 30,
  })
  @Column()
  height: number;

  @ApiProperty({
    description: 'Selling price per unit',
    example: 50.0,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Original/cost price per unit',
    example: 30.0,
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
    example: '/public/uploads/items/ceramic-item-1.jpg',
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
  @ManyToOne(() => ProductType, (productType) => productType.ceramicItems, {
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
