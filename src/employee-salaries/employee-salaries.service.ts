import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeSalary } from './entities/employee-salary.entity';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';

@Injectable()
export class EmployeeSalariesService {
  constructor(
    @InjectRepository(EmployeeSalary)
    private salariesRepository: Repository<EmployeeSalary>,
  ) {}

  async create(
    createEmployeeSalaryDto: CreateEmployeeSalaryDto,
  ): Promise<EmployeeSalary> {
    const salary = this.salariesRepository.create(createEmployeeSalaryDto);
    return this.salariesRepository.save(salary);
  }

  async findAll(): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findUnpaid(): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      where: { paid: false },
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findByEmployee(employee_id: number): Promise<EmployeeSalary[]> {
    return this.salariesRepository.find({
      where: { employee_id },
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC' },
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
    await this.salariesRepository.update(id, updateEmployeeSalaryDto);
    return this.findOne(id);
  }

  async markAsPaid(id: number): Promise<EmployeeSalary> {
    await this.salariesRepository.update(id, {
      paid: true,
      paid_date: new Date(),
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const salary = await this.findOne(id);
    await this.salariesRepository.remove(salary);
  }
}
