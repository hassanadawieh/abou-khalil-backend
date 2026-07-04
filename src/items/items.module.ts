import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CeramicItem } from './entities/ceramic-item.entity';
import { HealthyItem } from './entities/healthy-item.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      CeramicItem,
      HealthyItem,
      InvoiceItem,
      ProductType,
    ]),
  ],
  providers: [ItemsService],
  controllers: [ItemsController],
  exports: [ItemsService],
})
export class ItemsModule {}
