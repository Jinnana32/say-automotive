-- Generated from client CSV inputs on 2026-05-25.
-- Source files:
--   /Users/tjcoyoca/Downloads/SAY Auto Care Product Inventory - Products.csv
--   /Users/tjcoyoca/Downloads/SAY Auto Care Product Inventory - Service.csv
-- Target branch:
--   d521b15c-c639-4c61-a1ee-6e700bb14f18
-- Notes:
--   - This is a one-off manual import file and is intentionally outside supabase/migrations.
--   - Blank prices and stock figures were imported as 0.
--   - Product PRD-0082 had no unit in the CSV and was defaulted to 'Piece'.
--   - Inventory quantities are loaded as a direct stock snapshot; this does not create stock movement history.

begin;
set local search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.branches
    WHERE id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
  ) THEN
    RAISE EXCEPTION 'Branch % does not exist.', 'd521b15c-c639-4c61-a1ee-6e700bb14f18';
  END IF;
END $$;

create temporary table tmp_import_products (
  sku text not null,
  name text not null,
  category_name text,
  brand_name text,
  part_number text,
  oem_number text,
  barcode text,
  unit_name text not null,
  cost_price numeric(12,4) not null,
  selling_price numeric(12,4) not null,
  current_stock numeric(12,4) not null,
  reorder_level numeric(12,4) not null,
  shelf_location text,
  supplier_name text,
  description text
) on commit drop;

insert into tmp_import_products (
  sku,
  name,
  category_name,
  brand_name,
  part_number,
  oem_number,
  barcode,
  unit_name,
  cost_price,
  selling_price,
  current_stock,
  reorder_level,
  shelf_location,
  supplier_name,
  description
)
values
  ('PRD-0001', 'Everton 155-R12C', 'Tires', 'Everton', NULL, NULL, NULL, 'Piece', 0.0000, 280.0000, 4.0000, 10.0000, 'Shelf A1', 'Planters Auto Supply', NULL),
  ('PRD-0002', 'Maxtrex 175-70-R13', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3000.0000, 180.0000, 3.0000, 8.0000, 'Shelf B2', 'Planters Auto Supply', NULL),
  ('PRD-0003', 'Maxtrex 185-70-R13', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3500.0000, 420.0000, 4.0000, 5.0000, 'Shelf C1', 'Planters Auto Supply', NULL),
  ('PRD-0004', 'Torque 185-60-R14', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 5200.0000, 4.0000, 3.0000, 'Battery Rack', 'Planters Auto Supply', NULL),
  ('PRD-0005', 'Torque195-60-R14', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 1450.0000, 4.0000, 2.0000, 'Shelf B4', 'Planters Auto Supply', NULL),
  ('PRD-0006', 'Hankook 175-70-R14', 'Tires', 'Hankook', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0007', 'Falken 185-70-R14', 'Tires', 'Falken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0008', 'Nankang 185 R14', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0009', 'Maxtrex SU-800 31x10.5 R15LT', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0010', 'Torque 195-70-R14', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0011', 'Wideway 265-70 R16', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0012', 'Wideway 285-70 R17', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0013', 'Hankook 195-R14C', 'Tires', 'Hankook', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0014', 'Falken 195-R14', 'Tires', 'Falken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0015', 'Hankook 195 R14C', 'Tires', 'Hankook', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0016', 'Maxtrex Ditto RX 265-70-R16', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 10500.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0017', 'Maxtrex Hilltracker 265-65-R17', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9600.0000, 0.0000, 8.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0018', 'Forceland 205-65-R15', 'Tires', 'Forceland', NULL, NULL, NULL, 'Piece', 4300.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0019', 'Sumaxx Max Eco 195-65 R15', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 3900.0000, 0.0000, 3.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0020', 'Sumaxx All Terrain 205-65-R15', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 6700.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0021', 'Wideway 265-70-R17', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0022', 'Wideway 265-60-R18', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0023', 'Torque 195-55-R15', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0024', 'Maxtrex Hill 265-80- R18', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0025', 'Wideway 265-65-R18', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 3600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0026', 'Maxtrex Maximus M1 195-50-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0027', 'Nankang 175-50-R15', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 3.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0028', 'Nankang 195-50-R15', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0029', 'Nankang 205-65-R16', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0030', 'Torque 215-55-R16', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0031', 'Maxtrex SU-800 215-70-R16', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 5800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0032', 'Maxtrex Maximus M1 205-45ZR17', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 4500.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0033', 'Lenso 215-55Z R 17', 'Tires', 'Lenso', NULL, NULL, NULL, 'Piece', 6300.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0034', 'Grand Cruiser 265-65-R17', 'Tires', 'Grand Cruiser', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0035', 'Nankang 265-65-R17', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0036', 'Sumaxx A/T 265-70-R16', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 9200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0037', 'Sumaxx A/T 225-65-R17', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 7700.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0038', 'Sumaxx A/T 265-65-R17', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 9300.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0039', 'Hankook 185-65-R15', 'Tires', 'Hankook', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0040', 'Forceland 195-55-R15', 'Tires', 'Forceland', NULL, NULL, NULL, 'Piece', 3600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0041', 'Torque 205-40-R17', 'Tires', 'Torque', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0042', 'Maxtrex SU 830 205-65-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 4800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0043', 'Maxtrex Maximus M2 205-65-R16', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 4100.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0044', 'Maxtrex Sierra S6 235-55-R18', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 6900.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0045', 'Magnum V 7.00-15-', 'Tires', 'Magnum', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0046', 'Triken 7.00-15', 'Tires', 'Triken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0047', 'Triken 7.00-16', 'Tires', 'Triken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0048', 'Altura 7.5-16', 'Tires', 'Altura', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0049', 'Altura 7.5-15', 'Tires', 'Altura', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0050', 'Brightway 7.00-15', 'Tires', 'Brightway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0051', 'Vee Rubber 7.50-15', 'Tires', 'Vee Rubber', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0052', 'Vee Rubber 7.50-16', 'Tires', 'Vee Rubber', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0053', 'AMP Terrain Attack AT 285-70-R17 P/T', 'Tires', 'AMP', NULL, NULL, NULL, 'Piece', 16800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0054', 'AMP Terrain Attack RT 285-70-R17 THAI', 'Tires', 'AMP', NULL, NULL, NULL, 'Piece', 18800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0055', 'Dupro', 'Tires', 'Dupro', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 3.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0056', 'Maxtrex Maximus M1 235-50-R19', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 7200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0057', 'Maxtrex Fortis T5 245-35Z R20', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 7200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0058', 'Forceland 265-65 R17', 'Tires', 'Forceland', NULL, NULL, NULL, 'Piece', 8950.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0059', 'Maxtrex Maximus M2 215-50-R17', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 5200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0060', 'Maxtrex SU 800 275-55-R20', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 8500.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0061', 'Forceland Rebel Hawk R5 265-65-R17', 'Tires', 'Forceland', NULL, NULL, NULL, 'Piece', 8950.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0062', 'Maxtrex Ditto RX 265-60-R18', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9400.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0063', 'Sumaxx AT 285-70-R17', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 13800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0064', 'Sumaxx 265-65-R17', 'Tires', 'Sumaxx', NULL, NULL, NULL, 'Piece', 9300.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0065', 'Maxtrex Hilltracker 265-60-R18', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9800.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0066', 'Maxtrex Ditto RX 265-65-R17', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9400.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0067', 'Wideway 35x12.50 R20', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0068', 'Journey 33x12.5', 'Tires', 'Journey', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0069', 'AMP Terrain Pro AT/P 285-70-R17', 'Tires', 'AMP', NULL, NULL, NULL, 'Piece', 15200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0070', 'Wideway 285-55-R20', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0071', 'Wideway 275-55-R20', 'Tires', 'Wideway', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0072', 'Maxtrex Sierra S6 235-50-R18', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 6700.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0073', 'Maxtrex Maximus M1 185-60-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0074', 'Nankang 175-50-R15', 'Tires', 'Nankang', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0075', 'Falken 195-55-R15', 'Tires', 'Falken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0076', 'Hankook 185-60-R15', 'Tires', 'Hankook', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0077', 'Maxtrek Maximus M1 185-55-R16', 'Tires', 'Maxtrek', NULL, NULL, NULL, 'Piece', 3300.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0078', 'Maxtrek Maximus M1 195-55-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3400.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0079', 'Maxtrex SU-810 195-R14', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 5600.0000, 0.0000, 2.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0080', 'Maxtrex Maximus M1 185-70-R14', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0081', 'Maxtrex Maximus M2 215-55-R17', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 5200.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0082', 'Maxtrex Maximus M2 215-65-R16', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 0.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0083', 'Maxtrex Maximus M1 185-65-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 3600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0084', 'Torque 195-60-R14', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0085', 'Gand Cruiser 265-65-R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0086', 'Falken 205-65-R15', 'Tires', 'Falken', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0087', 'Maxtrex Ditto RX 275-55-R20', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 10600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0088', 'Maxtrex Mudtrac 31x10.5 R15', 'Tires', 'Maxtrex', NULL, NULL, NULL, 'Piece', 9600.0000, 0.0000, 4.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0089', 'Aisin Wiper Blade #17', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0090', 'Aisin Wiper Blade #15', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0091', 'Aisin Wiper Blade #19', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 2.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0092', 'Aisin Wiper Blade #20', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 3.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0093', 'Aisin Wiper Blade#26', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0094', 'Aisin Wiper Blade Classic Fir', 'Wiper Blade', 'Aisin', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Iloilo Auto Supply', NULL),
  ('PRD-0095', 'Bosch BA 14', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 8.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0096', 'Bosch BA16', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 3.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0097', 'Bosch BA 17', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 5.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0098', 'Bosch BA 18', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 11.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0099', 'Bosch BA 19', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 6.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0100', 'Bosch BA 20', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 12.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0101', 'Bosch Rear H 301', 'Wiper Blade Rear', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0102', 'Bosch Rear H 306', 'Wiper Blade Rear', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 9.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0103', 'Bosch Rear H 307', 'Wiper Blade Rear', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 9.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0104', 'Bosch BA 21', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 9.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0105', 'Bosch BA 22', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 8.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0106', 'Bosch BA 24', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 7.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0107', 'Bosch BA 26', 'Wiper Blade', 'Bosch', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 7.0000, 0.0000, NULL, 'VCY', NULL),
  ('PRD-0108', 'YSS Car Spring For Montero Rear-Display', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0109', 'YSS Car Spring For Fortuner Rear- Display', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0110', 'YSS Car Spring MUX Rear', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0111', 'YSS Car Spring MUX Front', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0112', 'YSS Car Spring MUX/Dmax 12.2 Front', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0113', 'YSS Car Spring Hi-Lux/Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0114', 'YSS Car Spring Strada/Triton/Montero', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0115', 'YSS Front  Shock Absorber Nissan Navarra-Display', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0116', 'YSS Rear Shock Absorber NIssan NavarraDisplay', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0117', 'YSS Rear Shock Absorber  Toyota FortunerDisplay', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0118', 'YSS Front  Shock Absorber Toyota HIlux/Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0119', 'YSS Reart Shock Absorber Toyota Hilux/Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0120', 'YSS Front Shock Absorber Nissan Navarra 2019-up', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0121', 'YSS Rear Shock Absorber Nissan Navarra 2019-up', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0122', 'YSS Front Shock Absorber Toyota Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0123', 'YSS Rear Shock Absorber Toyota Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0124', 'YSS Front Shock Absorber Toyota Innova', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0125', 'YSS Rear Shock Absorber Toyota Innova', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0126', 'YSS Front Shock Absorber Toyota Hi-Ace Commuter', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0127', 'YSS Rear Shock Absorber Toyota Hi- Ace Commuter', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0128', 'YSS Front Shock Absorber Isuzu Dmax', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0129', 'YSS Rear Shock Absorber Isuzu Dmax', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0130', 'YSS Front Shock Absorber Toyota Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0131', 'YSS Rear Shock Absorber Toyota Fortuner', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0132', 'YSS Front Shock Absorber Toyota Hi-Lux', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0133', 'YSS Rear Shock Absorber Toyota Hi-Lux', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0134', 'YSS Front Shock Absorber ISuzu MUX', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0135', 'YSS Rear Shock Absorber Isuzu MUX', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0136', 'YSS Front Shock Absorber Mitsubishi Strada/Triton', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL),
  ('PRD-0137', 'YSS Front Shock Absorber Mitsubishi Strada/Triton', 'Suspension', 'YSS', NULL, NULL, NULL, 'Piece', 0.0000, 0.0000, 1.0000, 0.0000, NULL, 'Planters Auto Supply', NULL)
;

create temporary table tmp_import_services (
  category text,
  name text not null,
  labor_price numeric(12,4) not null,
  description text
) on commit drop;

insert into tmp_import_services (
  category,
  name,
  labor_price,
  description
)
values
  ('Routine Maintenance', 'Oil Change Service', 0.0000, NULL),
  ('Routine Maintenance', 'Air Filter Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'Cabin Filter Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'Automatic Transmission Fluid Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'Engine Tune up', 0.0000, NULL),
  ('Routine Maintenance', 'Rear Brake Shoe Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'Front Brake Pad Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'CVT Fluid Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'PMS Oil Change', 0.0000, NULL),
  ('Routine Maintenance', 'Battery Health Check', 0.0000, NULL),
  ('Routine Maintenance', 'Engine Diagnostics', 0.0000, NULL),
  ('Routine Maintenance', 'Brake Inspection', 0.0000, NULL),
  ('Routine Maintenance', 'Alternator Repair', 0.0000, NULL),
  ('Routine Maintenance', 'Bumper Repair', 0.0000, NULL),
  ('Routine Maintenance', 'Brake Cleaning and Adjustment', 0.0000, NULL),
  ('Routine Maintenance', 'Brake Fluid Flush', 0.0000, NULL),
  ('Routine Maintenance', 'Coolant Flush', 0.0000, NULL),
  ('Routine Maintenance', 'Spark Plug Replacement', 0.0000, NULL),
  ('Routine Maintenance', 'Tire Rotation', 0.0000, NULL),
  ('Routine Maintenance', 'Underchassis Inspection', 0.0000, NULL),
  ('Routine Maintenance', 'Wheel Aligment', 0.0000, NULL),
  ('Routine Maintenance', 'Wheel Balancing', 0.0000, NULL),
  ('Routine Maintenance', 'Aircon Cleaning', 0.0000, NULL),
  ('Detailing & Protection', 'Interior Detailing', 0.0000, NULL),
  ('Detailing & Protection', 'Exterior Detailing', 0.0000, NULL),
  ('Detailing & Protection', 'Premium Detailing', 0.0000, NULL),
  ('Detailing & Protection', 'Ceramic Coating', 0.0000, NULL),
  ('Detailing & Protection', 'Paint Correction', 0.0000, NULL),
  ('Detailing & Protection', 'Headlight Restoration', 0.0000, NULL),
  ('Detailing & Protection', 'Window Tint Package', 0.0000, NULL)
;

insert into public.units (name, abbreviation)
select distinct
  src.unit_name,
  case lower(src.unit_name)
    when 'piece' then 'pc'
    when 'set' then 'set'
    when 'pair' then 'pair'
    when 'liter' then 'L'
    when 'bottle' then 'btl'
    when 'gallon' then 'gal'
    when 'can' then 'can'
    else left(regexp_replace(lower(src.unit_name), '[^a-z0-9]+', '', 'g'), 12)
  end as abbreviation
from tmp_import_products as src
where nullif(trim(src.unit_name), '') is not null
on conflict (name) do nothing;

insert into public.product_categories (name)
select distinct src.category_name
from tmp_import_products as src
where nullif(trim(src.category_name), '') is not null
on conflict (name) do nothing;

insert into public.brands (name)
select distinct src.brand_name
from tmp_import_products as src
where nullif(trim(src.brand_name), '') is not null
on conflict (name) do nothing;

insert into public.suppliers (supplier_name)
select distinct src.supplier_name
from tmp_import_products as src
where nullif(trim(src.supplier_name), '') is not null
on conflict (supplier_name) do nothing;

with staged_products as (
  select
    src.sku,
    src.name,
    src.barcode,
    categories.id as category_id,
    brands.id as brand_id,
    suppliers.id as supplier_id,
    units.id as unit_id,
    src.part_number,
    src.oem_number,
    src.description,
    src.cost_price,
    src.selling_price,
    src.reorder_level,
    src.shelf_location,
    src.current_stock
  from tmp_import_products as src
  left join public.product_categories as categories
    on lower(categories.name) = lower(src.category_name)
  left join public.brands as brands
    on lower(brands.name) = lower(src.brand_name)
  left join public.suppliers as suppliers
    on lower(suppliers.supplier_name) = lower(src.supplier_name)
  left join public.units as units
    on lower(units.name) = lower(src.unit_name)
)
update public.products as target
set
  is_global = false,
  name = staged.name,
  barcode = staged.barcode,
  category_id = staged.category_id,
  brand_id = staged.brand_id,
  primary_supplier_id = staged.supplier_id,
  unit_id = staged.unit_id,
  part_number = staged.part_number,
  oem_number = staged.oem_number,
  description = staged.description,
  product_type = 'part',
  cost_price = staged.cost_price,
  selling_price = staged.selling_price,
  reorder_level = staged.reorder_level,
  shelf_location = staged.shelf_location,
  status = 'active'
from staged_products as staged
where target.branch_id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
  and lower(target.sku) = lower(staged.sku);

insert into public.products (
  branch_id,
  is_global,
  name,
  sku,
  barcode,
  category_id,
  brand_id,
  primary_supplier_id,
  unit_id,
  part_number,
  oem_number,
  description,
  product_type,
  cost_price,
  selling_price,
  reorder_level,
  shelf_location,
  status
)
select
  'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid,
  false,
  staged.name,
  staged.sku,
  staged.barcode,
  staged.category_id,
  staged.brand_id,
  staged.supplier_id,
  staged.unit_id,
  staged.part_number,
  staged.oem_number,
  staged.description,
  'part'::public.product_type,
  staged.cost_price,
  staged.selling_price,
  staged.reorder_level,
  staged.shelf_location,
  'active'::public.record_status
from (
  select
    src.sku,
    src.name,
    src.barcode,
    categories.id as category_id,
    brands.id as brand_id,
    suppliers.id as supplier_id,
    units.id as unit_id,
    src.part_number,
    src.oem_number,
    src.description,
    src.cost_price,
    src.selling_price,
    src.reorder_level,
    src.shelf_location
  from tmp_import_products as src
  left join public.product_categories as categories
    on lower(categories.name) = lower(src.category_name)
  left join public.brands as brands
    on lower(brands.name) = lower(src.brand_name)
  left join public.suppliers as suppliers
    on lower(suppliers.supplier_name) = lower(src.supplier_name)
  left join public.units as units
    on lower(units.name) = lower(src.unit_name)
) as staged
where not exists (
  select 1
  from public.products as existing
  where existing.branch_id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
    and lower(existing.sku) = lower(staged.sku)
);

insert into public.inventory_stocks (
  branch_id,
  product_id,
  quantity_on_hand,
  reserved_quantity,
  reorder_level,
  shelf_location
)
select
  'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid,
  products.id,
  src.current_stock,
  0,
  src.reorder_level,
  src.shelf_location
from tmp_import_products as src
join public.products as products
  on products.branch_id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
 and lower(products.sku) = lower(src.sku)
on conflict (branch_id, product_id) do update
set
  quantity_on_hand = excluded.quantity_on_hand,
  reorder_level = excluded.reorder_level,
  shelf_location = excluded.shelf_location;

update public.services as target
set
  is_global = false,
  category = src.category,
  description = src.description,
  labor_price = src.labor_price,
  status = 'active'
from tmp_import_services as src
where target.branch_id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
  and lower(target.name) = lower(src.name)
  and lower(coalesce(target.category, '')) = lower(coalesce(src.category, ''));

insert into public.services (
  branch_id,
  is_global,
  name,
  category,
  description,
  labor_price,
  status
)
select
  'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid,
  false,
  src.name,
  src.category,
  src.description,
  src.labor_price,
  'active'::public.record_status
from tmp_import_services as src
where not exists (
  select 1
  from public.services as existing
  where existing.branch_id = 'd521b15c-c639-4c61-a1ee-6e700bb14f18'::uuid
    and lower(existing.name) = lower(src.name)
    and lower(coalesce(existing.category, '')) = lower(coalesce(src.category, ''))
);

commit;
