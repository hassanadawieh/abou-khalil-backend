import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { CeramicItem } from '../items/entities/ceramic-item.entity';
import { HealthyItem } from '../items/entities/healthy-item.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Customer } from '../customers/entities/customer.entity';
import { InvoiceItem } from '../items/entities/invoice-item.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CeramicItem,
      HealthyItem,
      Invoice,
      Customer,
      InvoiceItem,
    ]),
    AuthModule,
  ],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
