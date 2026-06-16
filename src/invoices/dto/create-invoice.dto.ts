import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { InvoiceType } from '../entities/invoice.entity';
import { InvoiceItemDto } from '../../items/dto/create-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Sum of all items amount',
    example: 1500.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Discount applied to the invoice',
    example: 100,
  })
  discount?: number;

  @ApiProperty({
    description: 'Delivery price (optional)',
    example: 50,
  })
  delivery_price?: number;

  @ApiProperty({
    description: 'Array of items with item_id, quantity, and item_type',
    isArray: true,
    type: InvoiceItemDto,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({
    description: 'Type of invoice (ceramic or healthy)',
    enum: InvoiceType,
    example: InvoiceType.CERAMIC,
  })
  type: InvoiceType;

  @ApiProperty({
    description: 'ID of the customer for this invoice',
    example: 1,
  })
  customer_id: number;
}
