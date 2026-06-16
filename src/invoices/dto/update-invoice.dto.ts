import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from '../entities/invoice.entity';
import { InvoiceItemDto } from '../../items/dto/create-item.dto';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({
    description: 'Sum of all items amount',
    example: 1500.5,
  })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Discount applied to the invoice',
    example: 100,
  })
  discount?: number;

  @ApiPropertyOptional({
    description: 'Delivery price (optional)',
    example: 50,
  })
  delivery_price?: number;

  @ApiPropertyOptional({
    description: 'Array of items with item_id, quantity, and item_type',
    isArray: true,
    type: InvoiceItemDto,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Type of invoice (ceramic or healthy)',
    enum: InvoiceType,
    example: InvoiceType.CERAMIC,
  })
  type?: InvoiceType;

  @ApiPropertyOptional({
    description: 'ID of the customer for this invoice',
    example: 1,
  })
  customer_id?: number;
}
