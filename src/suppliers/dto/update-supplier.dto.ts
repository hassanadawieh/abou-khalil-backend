import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional({
    description: 'The name of the supplier',
    example: 'Acme Supplies Inc.',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the supplier',
    example: '5551234567',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'The amount owed or in account',
    example: 50000.5,
  })
  amount?: number;
}
