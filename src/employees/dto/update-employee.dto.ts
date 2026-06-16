import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({
    description: 'The name of the employee',
    example: 'Jane Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the employee',
    example: '9876543210',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'The salary of the employee',
    example: 6000,
  })
  salary?: number;
}
