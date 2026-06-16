import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { EmployeeSalariesService } from './employee-salaries.service';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';
import { EmployeeSalary } from './entities/employee-salary.entity';

@ApiTags('employee-salaries')
@Controller('employee-salaries')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class EmployeeSalariesController {
  constructor(
    private readonly employeeSalariesService: EmployeeSalariesService,
  ) {}

  @Post()
  create(
    @Body() createEmployeeSalaryDto: CreateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    return this.employeeSalariesService.create(createEmployeeSalaryDto);
  }

  @Get()
  findAll(): Promise<EmployeeSalary[]> {
    return this.employeeSalariesService.findAll();
  }

  @Get('unpaid')
  findUnpaid(): Promise<EmployeeSalary[]> {
    return this.employeeSalariesService.findUnpaid();
  }

  @Get('employee/:employee_id')
  findByEmployee(
    @Param('employee_id') employee_id: string,
  ): Promise<EmployeeSalary[]> {
    return this.employeeSalariesService.findByEmployee(+employee_id);
  }

  @Get('by-month')
  findByYearMonth(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<EmployeeSalary[]> {
    return this.employeeSalariesService.findByYearMonth(+year, +month);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EmployeeSalary> {
    return this.employeeSalariesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeSalaryDto: UpdateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    return this.employeeSalariesService.update(+id, updateEmployeeSalaryDto);
  }

  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string): Promise<EmployeeSalary> {
    return this.employeeSalariesService.markAsPaid(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.employeeSalariesService.remove(+id);
  }
}
