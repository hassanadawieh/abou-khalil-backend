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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new supplier',
    description: 'Create a new supplier with name, phone number, and amount',
  })
  @ApiCreatedResponse({
    description: 'Supplier created successfully',
    type: Supplier,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Supplier> {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all suppliers',
    description: 'Retrieve a list of all suppliers',
  })
  @ApiOkResponse({
    description: 'List of suppliers retrieved successfully',
    type: [Supplier],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Supplier[]> {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get supplier by ID',
    description: 'Retrieve a specific supplier by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The supplier ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Supplier retrieved successfully',
    type: Supplier,
  })
  @ApiNotFoundResponse({
    description: 'Supplier with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Supplier> {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update supplier',
    description: 'Update supplier information',
  })
  @ApiParam({
    name: 'id',
    description: 'The supplier ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Supplier updated successfully',
    type: Supplier,
  })
  @ApiNotFoundResponse({
    description: 'Supplier with the specified ID not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Supplier> {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete supplier',
    description: 'Remove a supplier from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'The supplier ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Supplier deleted successfully',
    schema: {
      example: { message: 'Supplier with ID 1 has been deleted' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Supplier with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.suppliersService.remove(id);
  }
}
