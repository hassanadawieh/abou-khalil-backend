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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description:
      'Create a new invoice with items, type, and customer information',
  })
  @ApiCreatedResponse({
    description: 'Invoice created successfully',
    type: Invoice,
  })
  @ApiBadRequestResponse({
    description: 'Discount cannot be greater than amount',
  })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all invoices',
    description: 'Retrieve a list of all invoices with customer details',
  })
  @ApiOkResponse({
    description: 'List of invoices retrieved successfully',
    type: [Invoice],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Retrieve a specific invoice by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The invoice ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Invoice retrieved successfully',
    type: Invoice,
  })
  @ApiNotFoundResponse({
    description: 'Invoice with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update invoice information (amount, discount, items, etc.)',
  })
  @ApiParam({
    name: 'id',
    description: 'The invoice ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Invoice updated successfully',
    type: Invoice,
  })
  @ApiNotFoundResponse({
    description: 'Invoice with the specified ID not found',
  })
  @ApiBadRequestResponse({
    description: 'Discount cannot be greater than amount',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete invoice',
    description: 'Remove an invoice from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'The invoice ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Invoice deleted successfully',
    schema: {
      example: { message: 'Invoice with ID 1 has been deleted' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Invoice with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.invoicesService.remove(id);
  }
}
