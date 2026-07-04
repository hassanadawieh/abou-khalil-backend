ALTER TABLE ceramic_items
  ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2),
  ALTER COLUMN bag_quantity TYPE numeric(10,2) USING bag_quantity::numeric(10,2),
  ALTER COLUMN width TYPE numeric(10,2) USING width::numeric(10,2),
  ALTER COLUMN height TYPE numeric(10,2) USING height::numeric(10,2);

ALTER TABLE healthy_items
  ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2);
