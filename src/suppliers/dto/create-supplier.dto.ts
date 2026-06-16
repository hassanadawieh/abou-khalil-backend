import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'The name of the supplier',
    example: 'Acme Supplies Inc.',
  })
  name: string;

  @ApiProperty({
    description: 'The phone number of the supplier',
    example: '5551234567',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'The amount owed or in account',
    example: 50000.5,
  })
  amount: number;
}
