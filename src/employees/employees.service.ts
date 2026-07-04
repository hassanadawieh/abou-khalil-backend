import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeSalary } from '../employee-salaries/entities/employee-salary.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(EmployeeSalary)
    private salariesRepository: Repository<EmployeeSalary>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeesRepository.create({
      ...createEmployeeDto,
      salary: Number(createEmployeeDto.salary) || 0,
    });
    return this.employeesRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeesRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.name !== undefined) {
      employee.name = updateEmployeeDto.name;
    }
    if (updateEmployeeDto.phoneNumber !== undefined) {
      employee.phoneNumber = updateEmployeeDto.phoneNumber;
    }
    if (updateEmployeeDto.salary !== undefined) {
      employee.salary = Number(updateEmployeeDto.salary) || 0;

      // Keep unpaid monthly records aligned with the new base salary.
      await this.salariesRepository.update(
        { employee_id: employee.id, paid: false },
        { amount: employee.salary },
      );
    }

    return this.employeesRepository.save(employee);
  }

  async remove(id: number): Promise<{ message: string }> {
    const employee = await this.findOne(id);

    // Explicitly remove salary records first so history never becomes orphaned,
    // even if the DB FK is missing or misconfigured.
    await this.salariesRepository.delete({ employee_id: employee.id });
    await this.employeesRepository.remove(employee);

    return {
      message: `Employee with ID ${id} and related salary records have been deleted`,
    };
  }
}
