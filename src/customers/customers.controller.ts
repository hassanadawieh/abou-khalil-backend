import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { CreateCustomerHistoryEntryDto } from './dto/create-customer-history-entry.dto';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('customers')
@Controller('customers')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new customer',
    description:
      'Create a new customer with first name, last name, phone numbers, city, and amount',
  })
  @ApiCreatedResponse({
    description: 'Customer created successfully',
    type: Customer,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all customers',
    description: 'Retrieve a list of all customers',
  })
  @ApiOkResponse({
    description: 'List of customers retrieved successfully',
    type: [Customer],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get customer by ID',
    description: 'Retrieve a specific customer by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The customer ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Customer retrieved successfully',
    type: Customer,
  })
  @ApiNotFoundResponse({
    description: 'Customer with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get customer history',
    description:
      'Retrieve the customer with balance history entries including invoice-linked and manual transactions',
  })
  async findHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.customersService.findHistory(id);
  }

  @Post(':id/history')
  @ApiOperation({
    summary: 'Add customer payment or manual balance entry',
    description:
      'Add a payment entry or a manual additional amount entry to the customer history and current balance',
  })
  async addHistoryEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() createCustomerHistoryEntryDto: CreateCustomerHistoryEntryDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.customersService.addHistoryEntry(
      id,
      createCustomerHistoryEntryDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update customer',
    description:
      'Update customer information (first name, last name, phone numbers, city, or amount)',
  })
  @ApiParam({
    name: 'id',
    description: 'The customer ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Customer updated successfully',
    type: Customer,
  })
  @ApiNotFoundResponse({
    description: 'Customer with the specified ID not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete customer',
    description: 'Remove a customer from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'The customer ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Customer deleted successfully',
    schema: {
      example: { message: 'Customer with ID 1 has been deleted' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Customer with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.customersService.remove(id);
  }
}
