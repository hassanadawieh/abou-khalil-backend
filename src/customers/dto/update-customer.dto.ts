import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({
    description: 'The first name of the customer',
    example: 'Jane',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'The last name of the customer',
    example: 'Smith',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'The primary phone number of the customer',
    example: '1234567890',
  })
  phoneNumber1?: string;

  @ApiPropertyOptional({
    description: 'The secondary phone number of the customer (optional)',
    example: '0987654321',
  })
  phoneNumber2?: string;

  @ApiPropertyOptional({
    description: 'The city where the customer is located',
    example: 'Los Angeles',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'The amount associated with the customer',
    example: 2500.75,
    type: 'number',
  })
  amount?: number;
}
