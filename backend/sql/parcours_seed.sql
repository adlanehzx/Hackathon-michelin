-- Seed data for parcours filters on restaurants
-- Run after parcours_schema.sql

-- Enrich existing restaurants with synthetic filter tags (safe updates)
UPDATE public.restaurants
SET
  establishment_type = COALESCE(establishment_type, 'restaurant'),
  weather_setup = COALESCE(weather_setup, CASE WHEN random() > 0.5 THEN 'soleil' ELSE 'couvert' END),
  occasion_tags = COALESCE(occasion_tags, ARRAY['business', 'friends']),
  diet_options = COALESCE(diet_options, ARRAY['vegetarian']),
  service_options = COALESCE(service_options, ARRAY['terrasse', 'parking']),
  capacity_min = COALESCE(capacity_min, 1),
  capacity_max = COALESCE(capacity_max, 8),
  point_value = COALESCE(point_value, 25)
WHERE id IS NOT NULL;

-- Mark some restaurants as hotel-compatible to test mixed itineraries
UPDATE public.restaurants
SET establishment_type = 'hotel'
WHERE id IN (
  SELECT id FROM public.restaurants ORDER BY created_at DESC NULLS LAST LIMIT 4
);

-- Add chef selections and occasions on a subset
UPDATE public.restaurants
SET
  chef_selection_label = 'Lena Situations',
  occasion_tags = ARRAY['date', 'friends'],
  service_options = ARRAY['terrasse', 'pet friendly', 'valet']
WHERE id IN (
  SELECT id FROM public.restaurants ORDER BY name ASC LIMIT 3
);

UPDATE public.restaurants
SET
  chef_selection_label = 'Cheffe Manon',
  occasion_tags = ARRAY['business', 'family'],
  diet_options = ARRAY['vegetarian', 'gluten free']
WHERE id IN (
  SELECT id FROM public.restaurants ORDER BY name DESC LIMIT 3
);
