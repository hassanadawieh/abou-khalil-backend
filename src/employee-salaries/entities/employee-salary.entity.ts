import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('employee_salaries')
@Unique('UQ_employee_salary_period', ['employee_id', 'year', 'month'])
export class EmployeeSalary {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  employee_id: number;

  @ManyToOne(() => Employee, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paid_date: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
