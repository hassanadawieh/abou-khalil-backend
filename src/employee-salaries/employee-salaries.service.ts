import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeSalary } from './entities/employee-salary.entity';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class EmployeeSalariesService {
  constructor(
    @InjectRepository(EmployeeSalary)
    private salariesRepository: Repository<EmployeeSalary>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  private async getEmployeeOrFail(employeeId: number): Promise<Employee> {
    const employee = await this.employeesRepository.findOneBy({
      id: employeeId,
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return employee;
  }

  private async assertUniquePeriod(
    employeeId: number,
    year: number,
    month: number,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.salariesRepository.findOne({
      where: { employee_id: employeeId, year, month },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Salary record already exists for this employee in ${month}/${year}`,
      );
    }
  }

  async create(
    createEmployeeSalaryDto: CreateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    const employee = await this.getEmployeeOrFail(
      createEmployeeSalaryDto.employee_id,
    );

    await this.assertUniquePeriod(
      createEmployeeSalaryDto.employee_id,
      createEmployeeSalaryDto.year,
      createEmployeeSalaryDto.month,
    );

    const amount =
      createEmployeeSalaryDto.amount !== undefined &&
      createEmployeeSalaryDto.amount !== null
        ? Number(createEmployeeSalaryDto.amount)
        : Number(employee.salary);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Salary amount must be 0 or greater');
    }

    const salary = this.salariesRepository.create({
      employee_id: createEmployeeSalaryDto.employee_id,
      year: createEmployeeSalaryDto.year,
      month: createEmployeeSalaryDto.month,
      amount,
      paid: createEmployeeSalaryDto.paid ?? false,
      paid_date: createEmployeeSalaryDto.paid ? new Date() : null,
      notes: createEmployeeSalaryDto.notes ?? null,
    });

    return this.salariesRepository.save(salary);
  }

  async findAll(): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC', id: 'DESC' },
    });
  }

  async findUnpaid(): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      where: { paid: false },
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC', id: 'DESC' },
    });
  }

  async findByEmployee(employee_id: number): Promise<EmployeeSalary[]> {
    await this.getEmployeeOrFail(employee_id);

    return this.salariesRepository.find({
      where: { employee_id },
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC', id: 'DESC' },
    });
  }

  async findByYearMonth(
    year: number,
    month: number,
  ): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      where: { year, month },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<EmployeeSalary> {
    const salary = await this.salariesRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!salary) {
      throw new NotFoundException(`Salary record #${id} not found`);
    }
    return salary;
  }

  async update(
    id: number,
    updateEmployeeSalaryDto: UpdateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    const salary = await this.findOne(id);

    const nextEmployeeId =
      updateEmployeeSalaryDto.employee_id ?? salary.employee_id;
    const nextYear = updateEmployeeSalaryDto.year ?? salary.year;
    const nextMonth = updateEmployeeSalaryDto.month ?? salary.month;

    if (updateEmployeeSalaryDto.employee_id !== undefined) {
      await this.getEmployeeOrFail(updateEmployeeSalaryDto.employee_id);
    }

    await this.assertUniquePeriod(nextEmployeeId, nextYear, nextMonth, id);

    if (updateEmployeeSalaryDto.amount !== undefined) {
      const amount = Number(updateEmployeeSalaryDto.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException('Salary amount must be 0 or greater');
      }
      salary.amount = amount;
    }

    if (updateEmployeeSalaryDto.employee_id !== undefined) {
      salary.employee_id = updateEmployeeSalaryDto.employee_id;
    }
    if (updateEmployeeSalaryDto.year !== undefined) {
      salary.year = updateEmployeeSalaryDto.year;
    }
    if (updateEmployeeSalaryDto.month !== undefined) {
      salary.month = updateEmployeeSalaryDto.month;
    }
    if (updateEmployeeSalaryDto.notes !== undefined) {
      salary.notes = updateEmployeeSalaryDto.notes ?? null;
    }

    if (updateEmployeeSalaryDto.paid !== undefined) {
      salary.paid = updateEmployeeSalaryDto.paid;
      salary.paid_date = updateEmployeeSalaryDto.paid
        ? salary.paid_date ?? new Date()
        : null;
    }

    return this.salariesRepository.save(salary);
  }

  async markAsPaid(id: number): Promise<EmployeeSalary> {
    const salary = await this.findOne(id);

    if (salary.paid) {
      return salary;
    }

    salary.paid = true;
    salary.paid_date = new Date();
    return this.salariesRepository.save(salary);
  }

  async remove(id: number): Promise<{ message: string }> {
    const salary = await this.findOne(id);
    await this.salariesRepository.remove(salary);
    return { message: `Salary record #${id} has been deleted` };
  }

  async removeByEmployee(employeeId: number): Promise<number> {
    const result = await this.salariesRepository.delete({
      employee_id: employeeId,
    });
    return result.affected ?? 0;
  }
}
