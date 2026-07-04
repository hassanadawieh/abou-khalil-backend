-- Legacy helper. Prefer: scripts/fix-schema.sql
ALTER TABLE invoice_items
  ALTER COLUMN quantity TYPE numeric(10,2) USING COALESCE(quantity, 1)::numeric(10,2);

ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS unit_price numeric(10,2);

ALTER TABLE ceramic_items
  ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2),
  ALTER COLUMN bag_quantity TYPE numeric(10,2) USING bag_quantity::numeric(10,2),
  ALTER COLUMN width TYPE numeric(10,2) USING width::numeric(10,2),
  ALTER COLUMN height TYPE numeric(10,2) USING height::numeric(10,2);

ALTER TABLE healthy_items
  ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2);
