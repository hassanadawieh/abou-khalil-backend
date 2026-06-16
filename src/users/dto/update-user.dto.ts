import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'The username of the user. Must be unique.',
    example: 'jane_doe',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the user.',
    example: '9876543210',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'The password for the user account.',
    example: 'NewPassword123!',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'The role ID to assign to the user (1: admin, 2: superadmin, 3: employee)',
    example: 2,
    type: 'number',
  })
  role_id?: number;
}
