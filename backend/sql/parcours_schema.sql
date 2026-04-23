-- Parcours schema for Supabase Postgres

-- 1) Extend restaurants table to support advanced parcours filters
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS establishment_type text DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS distinction text,
  ADD COLUMN IF NOT EXISTS occasion_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weather_setup text,
  ADD COLUMN IF NOT EXISTS diet_options text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_options text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chef_selection_label text,
  ADD COLUMN IF NOT EXISTS capacity_min integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS capacity_max integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS point_value integer DEFAULT 25;

-- 2) Main parcours table
CREATE TABLE IF NOT EXISTS public.parcours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress, recommended, completed
  mode text NOT NULL DEFAULT 'parcours', -- parcours or ponctuel
  date_choice_type text DEFAULT 'periode', -- jour or periode
  start_date date,
  end_date date,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  addresses_count integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  collected_points integer NOT NULL DEFAULT 0,
  completion_percentage integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcours_user_status
  ON public.parcours(user_id, status, created_at DESC);

-- 3) Restaurants assigned to a parcours
CREATE TABLE IF NOT EXISTS public.parcours_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcours_id uuid NOT NULL REFERENCES public.parcours(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL,
  item_order integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 25,
  is_completed boolean NOT NULL DEFAULT false,
  reservation_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parcours_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_parcours_items_parcours
  ON public.parcours_items(parcours_id, item_order);

-- 4) Track visited restaurants for visited/new filter
CREATE TABLE IF NOT EXISTS public.restaurant_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  source text DEFAULT 'manual',
  visited_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_visits_user
  ON public.restaurant_visits(user_id, visited_at DESC);

-- Optional auto-update trigger for parcours.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parcours_updated_at ON public.parcours;
CREATE TRIGGER trg_parcours_updated_at
BEFORE UPDATE ON public.parcours
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();