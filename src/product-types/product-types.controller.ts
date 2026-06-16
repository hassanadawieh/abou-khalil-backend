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
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ProductType } from './entities/product-type.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('product-types')
@Controller('product-types')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product type',
    description: 'Create a new product type (e.g., Vase, Plate, etc.)',
  })
  @ApiCreatedResponse({
    description: 'Product type created successfully',
    type: ProductType,
  })
  async create(
    @Body() createProductTypeDto: CreateProductTypeDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<ProductType> {
    return this.productTypesService.create(createProductTypeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all product types',
    description: 'Retrieve a list of all product types',
  })
  @ApiOkResponse({
    description: 'List of product types retrieved successfully',
    type: [ProductType],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<ProductType[]> {
    return this.productTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product type by ID',
    description: 'Retrieve a specific product type by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The product type ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Product type retrieved successfully',
    type: ProductType,
  })
  @ApiNotFoundResponse({
    description: 'Product type with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<ProductType> {
    return this.productTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product type',
    description: 'Update product type information',
  })
  @ApiParam({
    name: 'id',
    description: 'The product type ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Product type updated successfully',
    type: ProductType,
  })
  @ApiNotFoundResponse({
    description: 'Product type with the specified ID not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductTypeDto: UpdateProductTypeDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<ProductType> {
    return this.productTypesService.update(id, updateProductTypeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product type',
    description: 'Delete a product type by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The product type ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Product type deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product type with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.productTypesService.remove(id);
  }
}
