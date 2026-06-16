import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The username of the user. Must be unique.',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'The phone number of the user.',
    example: '1234567890',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'The password for the user account.',
    example: 'SecurePassword123!',
  })
  password: string;

  @ApiProperty({
    description: 'The role ID to assign to the user (1: admin, 2: superadmin, 3: employee)',
    example: 1,
    type: 'number',
  })
  role_id: number;
}
