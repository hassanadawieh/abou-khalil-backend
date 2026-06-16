import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerHistoryEntryType } from '../entities/customer-history-entry.entity';

export class CreateCustomerHistoryEntryDto {
  @ApiProperty({
    enum: [
      CustomerHistoryEntryType.PAYMENT,
      CustomerHistoryEntryType.ADJUSTMENT,
    ],
    example: CustomerHistoryEntryType.PAYMENT,
  })
  @IsEnum(CustomerHistoryEntryType)
  type: CustomerHistoryEntryType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'دفعة عند الاستلام' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
