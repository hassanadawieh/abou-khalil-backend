import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Employee } from './entities/employee.entity';
import { EmployeeSalary } from '../employee-salaries/entities/employee-salary.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Employee, EmployeeSalary]),
  ],
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}

