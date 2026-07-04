-- Safe, idempotent schema fixes for production.
-- Run BEFORE Nest/TypeORM starts so synchronize does not drop/re-add columns.

-- 1) invoice_items.quantity: integer -> numeric (keep data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoice_items'
      AND column_name = 'quantity'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE invoice_items
      ALTER COLUMN quantity TYPE numeric(10,2)
      USING quantity::numeric(10,2);
  END IF;
END $$;

-- 2) invoice_items.unit_price
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS unit_price numeric(10,2);

UPDATE invoice_items ii
SET unit_price = c.price
FROM ceramic_items c
WHERE ii.ceramic_item_id = c.id
  AND ii.unit_price IS NULL;

UPDATE invoice_items ii
SET unit_price = h.price
FROM healthy_items h
WHERE ii.healthy_item_id = h.id
  AND ii.unit_price IS NULL;

UPDATE invoice_items
SET unit_price = 0
WHERE unit_price IS NULL;

UPDATE invoice_items
SET quantity = 1
WHERE quantity IS NULL;

-- 3) ceramic_items decimal fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'bag_quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN bag_quantity TYPE numeric(10,2) USING bag_quantity::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'width' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN width TYPE numeric(10,2) USING width::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'height' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN height TYPE numeric(10,2) USING height::numeric(10,2);
  END IF;
END $$;

-- 4) healthy_items.quantity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'healthy_items'
      AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE healthy_items
      ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2);
  END IF;
END $$;

-- 5) employee_salaries: one real FK on employee_id + unique period
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_9be022bd97dc15ebf40b2d813fa";
ALTER TABLE employee_salaries DROP COLUMN IF EXISTS "employeeId";

DELETE FROM employee_salaries
WHERE employee_id NOT IN (SELECT id FROM employees);

ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_employee_salaries_employee_id";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FK_employee_salaries_employee_id'
  ) THEN
    ALTER TABLE employee_salaries
      ADD CONSTRAINT "FK_employee_salaries_employee_id"
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_salary_period"
  ON employee_salaries (employee_id, year, month);
