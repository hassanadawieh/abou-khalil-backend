import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from './auth/entities/access-token.entity';
import { Role } from './roles/entities/role.entity';
import { User } from './users/entities/user.entity';
import { CeramicItem } from './items/entities/ceramic-item.entity';
import { HealthyItem } from './items/entities/healthy-item.entity';
import { InvoiceItem } from './items/entities/invoice-item.entity';
import { Employee } from './employees/entities/employee.entity';
import { Customer } from './customers/entities/customer.entity';
import { CustomerHistoryEntry } from './customers/entities/customer-history-entry.entity';
import { Supplier } from './suppliers/entities/supplier.entity';
import { Invoice } from './invoices/entities/invoice.entity';
import { Permission } from './roles/entities/permission.entity';
import { ProductType } from './product-types/entities/product-type.entity';
import { Expense } from './expenses/entities/expense.entity';
import { Notification } from './notifications/entities/notification.entity';
import { EmployeeSalary } from './employee-salaries/entities/employee-salary.entity';
import { PermissionSeeder } from './database/seeders/permission.seeder';
import { UserSeeder } from './database/seeders/user.seeder';
import { SeedCommand } from './database/commands/seed.command';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'abk_db'),
        entities: [
          Role,
          User,
          AccessToken,
          Employee,
          Customer,
          CustomerHistoryEntry,
          Supplier,
          Invoice,
          CeramicItem,
          HealthyItem,
          InvoiceItem,
          Permission,
          ProductType,
          Expense,
          Notification,
          EmployeeSalary,
        ],
        // Never use synchronize in production — it drop/re-adds columns and crashes
        // when changing integer -> decimal. Schema is applied by scripts/fix-schema.sql.
        synchronize:
          config.get<string>('DB_SYNC', 'false') === 'true' &&
          config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),

    }),
    TypeOrmModule.forFeature([Permission, Role, User]),
  ],
  providers: [PermissionSeeder, UserSeeder, SeedCommand],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
