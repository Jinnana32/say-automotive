create table if not exists public.inventory_stocks (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_on_hand numeric(14,4) not null default 0 check (quantity_on_hand >= 0),
  reserved_quantity numeric(14,4) not null default 0 check (reserved_quantity >= 0),
  available_quantity numeric(14,4) generated always as (quantity_on_hand - reserved_quantity) stored,
  reorder_level numeric(14,4),
  shelf_location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, product_id),
  check (quantity_on_hand >= reserved_quantity)
);

create index if not exists inventory_stocks_product_id_idx on public.inventory_stocks (product_id);
create index if not exists inventory_stocks_available_quantity_idx
  on public.inventory_stocks (available_quantity);

create trigger set_inventory_stocks_updated_at
before update on public.inventory_stocks
for each row
execute function public.set_updated_at();

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity numeric(14,4) not null check (quantity > 0),
  previous_quantity numeric(14,4) not null,
  new_quantity numeric(14,4) not null check (new_quantity >= 0),
  reference_type text not null,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists stock_movements_product_id_idx on public.stock_movements (product_id);
create index if not exists stock_movements_branch_id_idx on public.stock_movements (branch_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at desc);
