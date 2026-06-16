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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import {
  CreateCeramicItemDto,
  CreateHealthyItemDto,
} from './dto/create-item.dto';
import { CeramicItem } from './entities/ceramic-item.entity';
import { HealthyItem } from './entities/healthy-item.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('items')
@Controller('items')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  // Ceramic Items
  @Post('ceramic')
  @ApiOperation({
    summary: 'Create a ceramic item',
    description:
      'Create a new ceramic item with properties like width, height, bag info.\n\nNote: Image upload is a separate, optional operation. Use the /items/ceramic/{id}/upload-image endpoint after creating the item to add an image.',
  })
  @ApiCreatedResponse({
    description: 'Ceramic item created successfully',
    type: CeramicItem,
  })
  async createCeramicItem(
    @Body() createDto: CreateCeramicItemDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<CeramicItem> {
    return this.itemsService.createCeramicItem(createDto);
  }

  @Get('ceramic')
  @ApiOperation({
    summary: 'Get all ceramic items',
  })
  @ApiOkResponse({
    description: 'List of ceramic items',
    type: [CeramicItem],
  })
  async findAllCeramicItems(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<CeramicItem[]> {
    return this.itemsService.findAllCeramicItems();
  }

  @Get('ceramic/:id')
  @ApiOperation({
    summary: 'Get ceramic item by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Ceramic item retrieved',
    type: CeramicItem,
  })
  @ApiNotFoundResponse({
    description: 'Ceramic item not found',
  })
  async findCeramicItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<CeramicItem> {
    return this.itemsService.findCeramicItem(id);
  }

  @Patch('ceramic/:id')
  @ApiOperation({
    summary: 'Update ceramic item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Ceramic item updated',
    type: CeramicItem,
  })
  async updateCeramicItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateCeramicItemDto>,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<CeramicItem> {
    return this.itemsService.updateCeramicItem(id, updateDto);
  }

  @Delete('ceramic/:id')
  @ApiOperation({
    summary: 'Delete ceramic item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Ceramic item deleted',
  })
  async removeCeramicItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.itemsService.removeCeramicItem(id);
  }

  // Healthy Items
  @Post('healthy')
  @ApiOperation({
    summary: 'Create a healthy item',
    description:
      'Create a new healthy item with properties like color, quantity.\n\nNote: Image upload is a separate, optional operation. Use the /items/healthy/{id}/upload-image endpoint after creating the item to add an image.',
  })
  @ApiCreatedResponse({
    description: 'Healthy item created successfully',
    type: HealthyItem,
  })
  async createHealthyItem(
    @Body() createDto: CreateHealthyItemDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<HealthyItem> {
    return this.itemsService.createHealthyItem(createDto);
  }

  @Get('healthy')
  @ApiOperation({
    summary: 'Get all healthy items',
  })
  @ApiOkResponse({
    description: 'List of healthy items',
    type: [HealthyItem],
  })
  async findAllHealthyItems(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<HealthyItem[]> {
    return this.itemsService.findAllHealthyItems();
  }

  @Get('healthy/:id')
  @ApiOperation({
    summary: 'Get healthy item by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Healthy item retrieved',
    type: HealthyItem,
  })
  @ApiNotFoundResponse({
    description: 'Healthy item not found',
  })
  async findHealthyItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<HealthyItem> {
    return this.itemsService.findHealthyItem(id);
  }

  @Patch('healthy/:id')
  @ApiOperation({
    summary: 'Update healthy item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Healthy item updated',
    type: HealthyItem,
  })
  async updateHealthyItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateHealthyItemDto>,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<HealthyItem> {
    return this.itemsService.updateHealthyItem(id, updateDto);
  }

  @Delete('healthy/:id')
  @ApiOperation({
    summary: 'Delete healthy item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Healthy item deleted',
  })
  async removeHealthyItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.itemsService.removeHealthyItem(id);
  }

  // QR Code Endpoints
  @Get('ceramic/qr/:id')
  @ApiOperation({
    summary: 'Get QR code for ceramic item',
    description: 'Retrieve the QR code data URL for a specific ceramic item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Ceramic item ID',
  })
  @ApiOkResponse({
    description: 'QR code retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        qr_code: {
          type: 'string',
          description: 'Base64 encoded QR code data URL',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item or QR code not found',
  })
  async getCeramicQrCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ qr_code: string }> {
    const qr_code = await this.itemsService.getCeramicItemQrCode(id);
    return { qr_code };
  }

  @Post('ceramic/scan-qr')
  @ApiOperation({
    summary: 'Scan ceramic item QR code',
    description:
      'Scan a QR code and retrieve the ceramic item details. QR code data should be the JSON string encoded in the QR code.',
  })
  @ApiCreatedResponse({
    description: 'Item found from QR code',
    type: CeramicItem,
  })
  @ApiNotFoundResponse({
    description: 'Invalid QR code or item not found',
  })
  async scanCeramicQr(
    @Body() body: { qr_data: string },
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<CeramicItem> {
    return this.itemsService.scanCeramicQrCode(body.qr_data);
  }

  @Get('healthy/qr/:id')
  @ApiOperation({
    summary: 'Get QR code for healthy item',
    description: 'Retrieve the QR code data URL for a specific healthy item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Healthy item ID',
  })
  @ApiOkResponse({
    description: 'QR code retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        qr_code: {
          type: 'string',
          description: 'Base64 encoded QR code data URL',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item or QR code not found',
  })
  async getHealthyQrCode(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ qr_code: string }> {
    const qr_code = await this.itemsService.getHealthyItemQrCode(id);
    return { qr_code };
  }

  @Post('healthy/scan-qr')
  @ApiOperation({
    summary: 'Scan healthy item QR code',
    description:
      'Scan a QR code and retrieve the healthy item details. QR code data should be the JSON string encoded in the QR code.',
  })
  @ApiCreatedResponse({
    description: 'Item found from QR code',
    type: HealthyItem,
  })
  @ApiNotFoundResponse({
    description: 'Invalid QR code or item not found',
  })
  async scanHealthyQr(
    @Body() body: { qr_data: string },
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<HealthyItem> {
    return this.itemsService.scanHealthyQrCode(body.qr_data);
  }

  // Image Upload Endpoints
  @Post('ceramic/:id/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload image for ceramic item',
    description:
      'Upload an image file for a ceramic item. Supported formats: jpg, jpeg, png, gif, webp.\n\nThis endpoint is optional and should be used after creating the item. The image is not required for item creation.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Ceramic item ID',
  })
  @ApiCreatedResponse({
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'Path to the uploaded image',
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  async uploadCeramicImage(
    @Param('id', ParseIntPipe) id: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @UploadedFile() file: any,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ image_url: string; message: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpg, jpeg, png, gif, webp',
      );
    }

    // Verify item exists
    await this.itemsService.findCeramicItem(id);

    const image_url = await this.itemsService.saveCeramicItemImage(id, file);

    // Update item with image URL
    const item = await this.itemsService.findCeramicItem(id);
    const oldImageUrl = item.image_url;
    item.image_url = image_url;
    await this.itemsService.updateCeramicItem(id, item);

    // Delete old image if it exists
    if (oldImageUrl) {
      await this.itemsService.deleteCeramicItemImage(oldImageUrl);
    }

    return { image_url, message: 'Image uploaded successfully' };
  }

  @Post('healthy/:id/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload image for healthy item',
    description:
      'Upload an image file for a healthy item. Supported formats: jpg, jpeg, png, gif, webp.\n\nThis endpoint is optional and should be used after creating the item. The image is not required for item creation.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Healthy item ID',
  })
  @ApiCreatedResponse({
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'Path to the uploaded image',
        },
        message: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  async uploadHealthyImage(
    @Param('id', ParseIntPipe) id: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @UploadedFile() file: any,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ image_url: string; message: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpg, jpeg, png, gif, webp',
      );
    }

    // Verify item exists
    await this.itemsService.findHealthyItem(id);

    const image_url = await this.itemsService.saveHealthyItemImage(id, file);

    // Update item with image URL
    const item = await this.itemsService.findHealthyItem(id);
    const oldImageUrl = item.image_url;
    item.image_url = image_url;
    await this.itemsService.updateHealthyItem(id, item);

    // Delete old image if it exists
    if (oldImageUrl) {
      await this.itemsService.deleteHealthyItemImage(oldImageUrl);
    }

    return { image_url, message: 'Image uploaded successfully' };
  }

  @Get('ceramic/image/:id')
  @ApiOperation({
    summary: 'Get image URL for ceramic item',
    description: 'Get the image URL for a ceramic item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Ceramic item ID',
  })
  @ApiOkResponse({
    description: 'Image URL retrieved',
    schema: {
      type: 'object',
      properties: {
        image_url: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item or image not found',
  })
  async getCeramicItemImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ image_url: string }> {
    const item = await this.itemsService.findCeramicItem(id);
    if (!item.image_url) {
      throw new NotFoundException('No image found for this ceramic item');
    }
    return { image_url: item.image_url };
  }

  @Get('healthy/image/:id')
  @ApiOperation({
    summary: 'Get image URL for healthy item',
    description: 'Get the image URL for a healthy item',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Healthy item ID',
  })
  @ApiOkResponse({
    description: 'Image URL retrieved',
    schema: {
      type: 'object',
      properties: {
        image_url: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Item or image not found',
  })
  async getHealthyItemImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ image_url: string }> {
    const item = await this.itemsService.findHealthyItem(id);
    if (!item.image_url) {
      throw new NotFoundException('No image found for this healthy item');
    }
    return { image_url: item.image_url };
  }
}
