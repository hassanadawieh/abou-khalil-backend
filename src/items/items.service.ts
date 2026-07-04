import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { promises as _fs } from 'fs';
import * as _path from 'path';
import { CeramicItem } from './entities/ceramic-item.entity';
import { HealthyItem } from './entities/healthy-item.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import {
  CreateCeramicItemDto,
  CreateHealthyItemDto,
} from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(CeramicItem)
    private ceramicItemsRepository: Repository<CeramicItem>,
    @InjectRepository(HealthyItem)
    private healthyItemsRepository: Repository<HealthyItem>,
    @InjectRepository(ProductType)
    private productTypesRepository: Repository<ProductType>,
  ) {}

  private toDecimal(value: unknown, field: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${field} must be a valid number`);
    }
    return Number(parsed.toFixed(2));
  }

  private normalizeTypeId(typeId?: number | string | null): number | undefined {
    if (typeId === undefined || typeId === null || typeId === '') {
      return undefined;
    }
    const parsed = Number(typeId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return Math.trunc(parsed);
  }

  private async validateProductTypeId(typeId?: number | null): Promise<void> {
    const normalizedTypeId = this.normalizeTypeId(typeId);
    if (normalizedTypeId === undefined) {
      return;
    }

    const productType = await this.productTypesRepository.findOne({
      where: { id: normalizedTypeId },
    });

    if (!productType) {
      throw new BadRequestException(
        `Product type with ID ${normalizedTypeId} does not exist`,
      );
    }
  }

  private normalizeCeramicData(createDto: CreateCeramicItemDto) {
    const title = String(createDto.title ?? '').trim();
    const bag = String(createDto.bag ?? '').trim();

    if (!title) {
      throw new BadRequestException('Title is required');
    }
    if (!bag) {
      throw new BadRequestException('Bag is required');
    }

    const type_id = this.normalizeTypeId(createDto.type_id);

    return {
      title,
      bag,
      quantity: this.toDecimal(createDto.quantity, 'quantity'),
      bag_quantity: this.toDecimal(createDto.bag_quantity, 'bag_quantity'),
      width: this.toDecimal(createDto.width, 'width'),
      height: this.toDecimal(createDto.height, 'height'),
      price: this.toDecimal(createDto.price, 'price'),
      main_price: this.toDecimal(createDto.main_price, 'main_price'),
      type_id,
      image: createDto.image,
    };
  }

  private normalizeHealthyData(createDto: CreateHealthyItemDto) {
    const title = String(createDto.title ?? '').trim();
    const color = String(createDto.color ?? '').trim();

    if (!title) {
      throw new BadRequestException('Title is required');
    }
    if (!color) {
      throw new BadRequestException('Color is required');
    }

    const type_id = this.normalizeTypeId(createDto.type_id);

    return {
      title,
      color,
      quantity: this.toDecimal(createDto.quantity, 'quantity'),
      price: this.toDecimal(createDto.price, 'price'),
      main_price: this.toDecimal(createDto.main_price, 'main_price'),
      type_id,
      image: createDto.image,
    };
  }

  // Ceramic Items
  async createCeramicItem(
    createDto: CreateCeramicItemDto,
  ): Promise<CeramicItem> {
    const { image, type_id, ...itemData } = this.normalizeCeramicData(createDto);
    await this.validateProductTypeId(type_id);
    const item = this.ceramicItemsRepository.create({
      ...itemData,
      ...(type_id !== undefined ? { type_id } : {}),
    });

    // Save first, then update with QR code and optional image
    const savedItem = await this.ceramicItemsRepository.save(item);

    // Generate QR code containing item ID and type
    const qrData = JSON.stringify({
      type: 'ceramic',
      id: savedItem.id,
      title: savedItem.title,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // Update the item with the QR code and optional image
    savedItem.qr_code = qrCode;
    if (image) {
      savedItem.image_url = image;
    }
    return this.ceramicItemsRepository.save(savedItem);
  }

  async findAllCeramicItems(): Promise<CeramicItem[]> {
    return this.ceramicItemsRepository.find();
  }

  async findCeramicItem(id: number): Promise<CeramicItem> {
    const item = await this.ceramicItemsRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Ceramic item with ID ${id} not found`);
    }
    return item;
  }

  async updateCeramicItem(
    id: number,
    updateDto: Partial<CreateCeramicItemDto>,
  ): Promise<CeramicItem> {
    const item = await this.findCeramicItem(id);
    const normalized = this.normalizeCeramicData({
      title: updateDto.title ?? item.title,
      bag: updateDto.bag ?? item.bag,
      quantity: updateDto.quantity ?? item.quantity,
      bag_quantity: updateDto.bag_quantity ?? item.bag_quantity,
      width: updateDto.width ?? item.width,
      height: updateDto.height ?? item.height,
      price: updateDto.price ?? item.price,
      main_price: updateDto.main_price ?? item.main_price,
      type_id:
        updateDto.type_id !== undefined ? updateDto.type_id : item.type_id,
      image: updateDto.image,
    });

    await this.validateProductTypeId(normalized.type_id);

    item.title = normalized.title;
    item.bag = normalized.bag;
    item.quantity = normalized.quantity;
    item.bag_quantity = normalized.bag_quantity;
    item.width = normalized.width;
    item.height = normalized.height;
    item.price = normalized.price;
    item.main_price = normalized.main_price;
    item.type_id = normalized.type_id;
    if (normalized.image) {
      item.image_url = normalized.image;
    }

    return this.ceramicItemsRepository.save(item);
  }

  async removeCeramicItem(id: number): Promise<{ message: string }> {
    await this.findCeramicItem(id);
    await this.ceramicItemsRepository.delete(id);
    return { message: `Ceramic item with ID ${id} has been deleted` };
  }

  // Healthy Items
  async createHealthyItem(
    createDto: CreateHealthyItemDto,
  ): Promise<HealthyItem> {
    const { image, type_id, ...itemData } = this.normalizeHealthyData(createDto);
    await this.validateProductTypeId(type_id);
    const item = this.healthyItemsRepository.create({
      ...itemData,
      ...(type_id !== undefined ? { type_id } : {}),
    });

    // Save first, then update with QR code and optional image
    const savedItem = await this.healthyItemsRepository.save(item);

    // Generate QR code containing item ID and type
    const qrData = JSON.stringify({
      type: 'healthy',
      id: savedItem.id,
      title: savedItem.title,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // Update the item with the QR code and optional image
    savedItem.qr_code = qrCode;
    if (image) {
      savedItem.image_url = image;
    }
    return this.healthyItemsRepository.save(savedItem);
  }

  async findAllHealthyItems(): Promise<HealthyItem[]> {
    return this.healthyItemsRepository.find();
  }

  async findHealthyItem(id: number): Promise<HealthyItem> {
    const item = await this.healthyItemsRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Healthy item with ID ${id} not found`);
    }
    return item;
  }

  async updateHealthyItem(
    id: number,
    updateDto: Partial<CreateHealthyItemDto>,
  ): Promise<HealthyItem> {
    const item = await this.findHealthyItem(id);
    const normalized = this.normalizeHealthyData({
      title: updateDto.title ?? item.title,
      color: updateDto.color ?? item.color,
      quantity: updateDto.quantity ?? item.quantity,
      price: updateDto.price ?? item.price,
      main_price: updateDto.main_price ?? item.main_price,
      type_id:
        updateDto.type_id !== undefined ? updateDto.type_id : item.type_id,
      image: updateDto.image,
    });

    await this.validateProductTypeId(normalized.type_id);

    item.title = normalized.title;
    item.color = normalized.color;
    item.quantity = normalized.quantity;
    item.price = normalized.price;
    item.main_price = normalized.main_price;
    item.type_id = normalized.type_id;
    if (normalized.image) {
      item.image_url = normalized.image;
    }

    return this.healthyItemsRepository.save(item);
  }

  async removeHealthyItem(id: number): Promise<{ message: string }> {
    await this.findHealthyItem(id);
    await this.healthyItemsRepository.delete(id);
    return { message: `Healthy item with ID ${id} has been deleted` };
  }

  // QR Code Methods
  async scanCeramicQrCode(qrData: string): Promise<CeramicItem> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const data: any = JSON.parse(qrData);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (data.type !== 'ceramic' || !data.id) {
        throw new Error('Invalid ceramic QR code data');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return this.findCeramicItem(Number(data.id));
    } catch {
      throw new NotFoundException('Invalid or corrupted QR code');
    }
  }

  async scanHealthyQrCode(qrData: string): Promise<HealthyItem> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
      const data: any = JSON.parse(qrData);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (data.type !== 'healthy' || !data.id) {
        throw new Error('Invalid healthy QR code data');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return this.findHealthyItem(Number(data.id));
    } catch {
      throw new NotFoundException('Invalid or corrupted QR code');
    }
  }

  async getCeramicItemQrCode(id: number): Promise<string> {
    const item = await this.findCeramicItem(id);
    if (!item.qr_code) {
      throw new NotFoundException(`QR code not found for ceramic item ${id}`);
    }
    return item.qr_code;
  }

  async getHealthyItemQrCode(id: number): Promise<string> {
    const item = await this.findHealthyItem(id);
    if (!item.qr_code) {
      throw new NotFoundException(`QR code not found for healthy item ${id}`);
    }
    return item.qr_code;
  }

  // Image Upload Methods
  private getUploadDir(): string {
    return _path.join(process.cwd(), 'public', 'uploads', 'items');
  }

  private generateImageFilename(itemId: number, originalName: string): string {
    const ext = _path.extname(originalName);
    const timestamp = Date.now();
    return `item-${itemId}-${timestamp}${ext}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveCeramicItemImage(itemId: number, file: any): Promise<string> {
    const uploadDir = this.getUploadDir();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const filename = this.generateImageFilename(
      itemId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file.originalname as string,
    );
    const filepath = _path.join(uploadDir, filename);

    // Ensure directory exists
    await _fs.mkdir(uploadDir, { recursive: true });

    // Save file
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    await _fs.writeFile(filepath, file.buffer);

    // Return relative URL path
    return `/public/uploads/items/${filename}`;
  }

  async saveHealthyItemImage(itemId: number, file: any): Promise<string> {
    return this.saveCeramicItemImage(itemId, file);
  }

  async deleteCeramicItemImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      const uploadDir = this.getUploadDir();
      const filename = _path.basename(imageUrl);
      const filepath = _path.join(uploadDir, filename);

      // Verify file is within upload directory (security)
      const resolvedPath = _path.resolve(filepath);
      const resolvedDir = _path.resolve(uploadDir);
      if (!resolvedPath.startsWith(resolvedDir)) {
        throw new Error('Invalid image path');
      }

      await _fs.unlink(filepath);
    } catch {
      // Silently fail if file doesn't exist
    }
  }

  async deleteHealthyItemImage(imageUrl: string): Promise<void> {
    return this.deleteCeramicItemImage(imageUrl);
  }
}
