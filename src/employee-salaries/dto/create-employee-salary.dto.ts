import {
  IsNumber,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateEmployeeSalaryDto {
  @IsInt()
  @Min(1)
  employee_id: number;

  @IsInt()
  @Min(2000)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  /** Defaults to the employee's base salary when omitted. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
