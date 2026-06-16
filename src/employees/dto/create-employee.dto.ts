import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'The name of the employee',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The phone number of the employee',
    example: '1234567890',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'The salary of the employee',
    example: 5000,
  })
  salary: number;
}
