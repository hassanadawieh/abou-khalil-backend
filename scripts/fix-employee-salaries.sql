-- Remove orphan salary rows (employees already deleted)
DELETE FROM employee_salaries
WHERE employee_id NOT IN (SELECT id FROM employees);

-- Drop the wrong FK column TypeORM created without @JoinColumn
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_9be022bd97dc15ebf40b2d813fa";
ALTER TABLE employee_salaries DROP COLUMN IF EXISTS "employeeId";

-- Ensure the real employee_id column has CASCADE FK
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_employee_salaries_employee_id";
ALTER TABLE employee_salaries
  ADD CONSTRAINT "FK_employee_salaries_employee_id"
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- One salary record per employee per month
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_salary_period"
  ON employee_salaries (employee_id, year, month);
