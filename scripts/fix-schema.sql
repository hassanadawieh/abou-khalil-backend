-- Production schema repair. Safe to run many times.
-- Must not fail startup; entrypoint continues even if some statements error.

-- Drop broken TypeORM auto column on employee_salaries
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_9be022bd97dc15ebf40b2d813fa";
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_5cee264c9d34d5836769435cb0c";
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_employee_salaries_employee_id";
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "UQ_employee_salary_period";
DROP INDEX IF EXISTS "public"."IDX_5cee264c9d34d5836769435cb0";
DROP INDEX IF EXISTS "public"."UQ_employee_salary_period";
ALTER TABLE employee_salaries DROP COLUMN IF EXISTS "employeeId";

-- invoice_items.quantity -> numeric
ALTER TABLE invoice_items
  ALTER COLUMN quantity TYPE numeric(10,2)
  USING COALESCE(quantity, 1)::numeric(10,2);

ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS unit_price numeric(10,2);

UPDATE invoice_items ii
SET unit_price = c.price
FROM ceramic_items c
WHERE ii.ceramic_item_id = c.id AND ii.unit_price IS NULL;

UPDATE invoice_items ii
SET unit_price = h.price
FROM healthy_items h
WHERE ii.healthy_item_id = h.id AND ii.unit_price IS NULL;

UPDATE invoice_items SET unit_price = 0 WHERE unit_price IS NULL;
UPDATE invoice_items SET quantity = 1 WHERE quantity IS NULL;

-- ceramic_items decimals
ALTER TABLE ceramic_items
  ALTER COLUMN quantity TYPE numeric(10,2)
  USING COALESCE(quantity, 0)::numeric(10,2);

ALTER TABLE ceramic_items
  ALTER COLUMN bag_quantity TYPE numeric(10,2)
  USING COALESCE(bag_quantity, 0)::numeric(10,2);

ALTER TABLE ceramic_items
  ALTER COLUMN width TYPE numeric(10,2)
  USING COALESCE(width, 0)::numeric(10,2);

ALTER TABLE ceramic_items
  ALTER COLUMN height TYPE numeric(10,2)
  USING COALESCE(height, 0)::numeric(10,2);

UPDATE ceramic_items SET quantity = 0 WHERE quantity IS NULL;

-- healthy_items.quantity
ALTER TABLE healthy_items
  ALTER COLUMN quantity TYPE numeric(10,2)
  USING COALESCE(quantity, 0)::numeric(10,2);

UPDATE healthy_items SET quantity = 0 WHERE quantity IS NULL;

-- employee_salaries FK
DELETE FROM employee_salaries
WHERE employee_id IS NOT NULL
  AND employee_id NOT IN (SELECT id FROM employees);

ALTER TABLE employee_salaries
  ADD CONSTRAINT "FK_employee_salaries_employee_id"
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_salary_period"
  ON employee_salaries (employee_id, year, month);
