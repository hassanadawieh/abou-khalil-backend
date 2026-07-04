import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ItemsModule } from './items/items.module';
import { BalanceModule } from './balance/balance.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ExpensesModule } from './expenses/expenses.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmployeeSalariesModule } from './employee-salaries/employee-salaries.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    RolesModule,
    UsersModule,
    EmployeesModule,
    CustomersModule,
    SuppliersModule,
    ProductTypesModule,
    ExpensesModule,
    NotificationsModule,
    EmployeeSalariesModule,
    InvoicesModule,
    ItemsModule,
    BalanceModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
