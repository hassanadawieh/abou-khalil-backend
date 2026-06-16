import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CeramicItem } from '../../items/entities/ceramic-item.entity';
import { HealthyItem } from '../../items/entities/healthy-item.entity';

@Entity('product_types')
export class ProductType {
  @ApiProperty({
    description: 'The unique identifier for the product type',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the product type',
    example: 'Vase',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'The description of the product type',
    example: 'Decorative ceramic vase',
    nullable: true,
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'The date and time when the product type was created',
    example: '2026-04-03T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the product type was last updated',
    example: '2026-04-03T10:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CeramicItem, (ceramic) => ceramic.productType)
  ceramicItems?: CeramicItem[];

  @OneToMany(() => HealthyItem, (healthy) => healthy.productType)
  healthyItems?: HealthyItem[];
}
