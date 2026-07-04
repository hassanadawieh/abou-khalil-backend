-- Safe, idempotent schema fixes.
-- Applied by Docker entrypoint BEFORE Nest starts.
-- TypeORM synchronize is disabled in production to avoid drop/re-add crashes.

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN quantity numeric(10,2) NOT NULL DEFAULT 1;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoice_items'
      AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE invoice_items
      ALTER COLUMN quantity TYPE numeric(10,2)
      USING COALESCE(quantity, 1)::numeric(10,2);
  END IF;
END $$;

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

UPDATE invoice_items SET unit_price = 0 WHERE unit_price IS NULL;
UPDATE invoice_items SET quantity = 1 WHERE quantity IS NULL;

ALTER TABLE invoice_items
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN quantity SET NOT NULL;

-- ---------------------------------------------------------------------------
-- ceramic_items
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE ceramic_items ADD COLUMN quantity numeric(10,2) NOT NULL DEFAULT 0;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN quantity TYPE numeric(10,2)
      USING COALESCE(quantity, 0)::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'bag_quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN bag_quantity TYPE numeric(10,2)
      USING COALESCE(bag_quantity, 0)::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'width' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN width TYPE numeric(10,2)
      USING COALESCE(width, 0)::numeric(10,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ceramic_items'
      AND column_name = 'height' AND data_type = 'integer'
  ) THEN
    ALTER TABLE ceramic_items
      ALTER COLUMN height TYPE numeric(10,2)
      USING COALESCE(height, 0)::numeric(10,2);
  END IF;
END $$;

UPDATE ceramic_items SET quantity = 0 WHERE quantity IS NULL;
UPDATE ceramic_items SET bag_quantity = 0 WHERE bag_quantity IS NULL;
UPDATE ceramic_items SET width = 0 WHERE width IS NULL;
UPDATE ceramic_items SET height = 0 WHERE height IS NULL;

-- ---------------------------------------------------------------------------
-- healthy_items
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'healthy_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE healthy_items ADD COLUMN quantity numeric(10,2) NOT NULL DEFAULT 0;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'healthy_items'
      AND column_name = 'quantity' AND data_type = 'integer'
  ) THEN
    ALTER TABLE healthy_items
      ALTER COLUMN quantity TYPE numeric(10,2)
      USING COALESCE(quantity, 0)::numeric(10,2);
  END IF;
END $$;

UPDATE healthy_items SET quantity = 0 WHERE quantity IS NULL;

ALTER TABLE healthy_items
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN quantity SET NOT NULL;

-- ---------------------------------------------------------------------------
-- employee_salaries: remove broken TypeORM employeeId column, keep employee_id FK
-- ---------------------------------------------------------------------------
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_9be022bd97dc15ebf40b2d813fa";
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_5cee264c9d34d5836769435cb0c";
ALTER TABLE employee_salaries DROP CONSTRAINT IF EXISTS "FK_employee_salaries_employee_id";
DROP INDEX IF EXISTS "public"."IDX_5cee264c9d34d5836769435cb0";
DROP INDEX IF EXISTS "public"."UQ_employee_salary_period";
ALTER TABLE employee_salaries DROP COLUMN IF EXISTS "employeeId";

DELETE FROM employee_salaries
WHERE employee_id IS NOT NULL
  AND employee_id NOT IN (SELECT id FROM employees);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_employee_salaries_employee_id'
  ) THEN
    ALTER TABLE employee_salaries
      ADD CONSTRAINT "FK_employee_salaries_employee_id"
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_salary_period"
  ON employee_salaries (employee_id, year, month);
