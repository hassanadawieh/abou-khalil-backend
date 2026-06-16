import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private productTypesRepository: Repository<ProductType>,
  ) {}

  async create(
    createProductTypeDto: CreateProductTypeDto,
  ): Promise<ProductType> {
    const productType =
      this.productTypesRepository.create(createProductTypeDto);
    return this.productTypesRepository.save(productType);
  }

  async findAll(): Promise<ProductType[]> {
    return this.productTypesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ProductType> {
    const productType = await this.productTypesRepository.findOne({
      where: { id },
    });
    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }
    return productType;
  }

  async update(
    id: number,
    updateProductTypeDto: UpdateProductTypeDto,
  ): Promise<ProductType> {
    const productType = await this.findOne(id);
    Object.assign(productType, updateProductTypeDto);
    return this.productTypesRepository.save(productType);
  }

  async remove(id: number): Promise<{ message: string }> {
    const productType = await this.findOne(id);
    await this.productTypesRepository.remove(productType);
    return { message: `Product type with ID ${id} has been deleted` };
  }
}
