import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'The first name of the customer',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the customer',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'The primary phone number of the customer',
    example: '1234567890',
  })
  phoneNumber1: string;

  @ApiProperty({
    description: 'The secondary phone number of the customer (optional)',
    example: '0987654321',
    required: false,
  })
  phoneNumber2?: string;

  @ApiProperty({
    description: 'The city where the customer is located',
    example: 'New York',
  })
  city: string;

  @ApiProperty({
    description: 'The amount associated with the customer',
    example: 1500.5,
    type: 'number',
  })
  amount: number;
}
