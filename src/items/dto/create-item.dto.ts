import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ItemType {
  CERAMIC = 'ceramic',
  HEALTHY = 'healthy',
}

export class CreateCeramicItemDto {
  @ApiProperty({ example: 'White Ceramic Plate' })
  title: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiProperty({ example: 'Large' })
  bag: string;

  @ApiProperty({ example: 10 })
  bag_quantity: number;

  @ApiProperty({ example: 25 })
  width: number;

  @ApiProperty({ example: 30 })
  height: number;

  @ApiProperty({ example: 50.0 })
  price: number;

  @ApiProperty({ example: 30.0 })
  main_price: number;

  @ApiProperty({
    example: 1,
    description: 'Product type ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  type_id?: number;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Optional base64 encoded image or image URL',
    required: false,
  })
  @IsOptional()
  image?: string;
}

export class CreateHealthyItemDto {
  @ApiProperty({ example: 'Organic Green Tea' })
  title: string;

  @ApiProperty({ example: 500 })
  quantity: number;

  @ApiProperty({ example: 'Green' })
  color: string;

  @ApiProperty({ example: 25.0 })
  price: number;

  @ApiProperty({ example: 15.0 })
  main_price: number;

  @ApiProperty({
    example: 1,
    description: 'Product type ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  type_id?: number;

  @ApiProperty({
    example: 'data:image/png;base64,...',
    description: 'Optional base64 encoded image or image URL',
    required: false,
  })
  @IsOptional()
  image?: string;
}

export class InvoiceItemDto {
  @ApiProperty({
    enum: ItemType,
    example: ItemType.CERAMIC,
  })
  @IsEnum(ItemType)
  item_type: ItemType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  item_id: number;

  @ApiProperty({ example: 4 })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description:
      'Optional place/location for the invoice item (mainly for ceramic)',
    example: 'مخزن A - رف 3',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  place?: string;
}
