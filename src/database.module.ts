import { Module } from '@nestjs/common';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: String(process.env.DB_PASSWORD || 'postgres'),
      database: process.env.DB_NAME || 'abk_db',
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
      synchronize: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([Permission, Role, User]),
  ],
  providers: [PermissionSeeder, UserSeeder, SeedCommand],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
