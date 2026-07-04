import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EmployeeSalariesService } from './employee-salaries.service';
import { EmployeeSalariesController } from './employee-salaries.controller';
import { EmployeeSalary } from './entities/employee-salary.entity';
import { Employee } from '../employees/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeSalary, Employee]),
    AuthModule,
  ],
  controllers: [EmployeeSalariesController],
  providers: [EmployeeSalariesService],
  exports: [EmployeeSalariesService],
})
export class EmployeeSalariesModule {}
