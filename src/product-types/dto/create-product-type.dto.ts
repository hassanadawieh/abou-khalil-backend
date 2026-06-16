import { ApiProperty } from '@nestjs/swagger';

export class CreateProductTypeDto {
  @ApiProperty({
    description: 'The name of the product type',
    example: 'Vase',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the product type',
    example: 'Decorative ceramic vase',
    required: false,
  })
  description?: string;
}
