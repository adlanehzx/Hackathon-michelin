-- Build real parcours data from existing users/restaurants
-- Run this after parcours_schema.sql

-- Compatibility layer:
-- Some databases use bigint ids for users/restaurants while parcours tables were created with uuid columns.
-- We normalize relation columns to text so both bigint and uuid ids can be used safely.
ALTER TABLE public.parcours
  ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.parcours_items
  ALTER COLUMN restaurant_id TYPE text USING restaurant_id::text;

ALTER TABLE public.restaurant_visits
  ALTER COLUMN user_id TYPE text USING user_id::text,
  ALTER COLUMN restaurant_id TYPE text USING restaurant_id::text;

DO $$
DECLARE
  u RECORD;
  current_parcours_id uuid;
  recommended_parcours_id uuid;
  user_id_text text;
BEGIN
  FOR u IN SELECT id FROM public.users LOOP
    user_id_text := u.id::text;

    -- Non-destructive mode:
    -- we insert a new generation of parcours for each execution.
    -- Existing parcours rows are kept for audit/history.

    INSERT INTO public.parcours (
      user_id,
      title,
      status,
      mode,
      date_choice_type,
      filters
    )
    VALUES (
      user_id_text,
      'Parcours bistrots français',
      'in_progress',
      'parcours',
      'periode',
      jsonb_build_object(
        'mode', 'parcours',
        'establishmentTypes', jsonb_build_array('restaurant'),
        'cuisines', jsonb_build_array('francaise', 'french'),
        'visitedPreference', 'all'
      )
    )
    RETURNING id INTO current_parcours_id;

    INSERT INTO public.parcours (
      user_id,
      title,
      status,
      mode,
      date_choice_type,
      filters
    )
    VALUES (
      user_id_text,
      'Parcours asiatiques',
      'recommended',
      'parcours',
      'periode',
      jsonb_build_object(
        'mode', 'parcours',
        'establishmentTypes', jsonb_build_array('restaurant'),
        'cuisines', jsonb_build_array('asiatique', 'japanese', 'chinese', 'thai', 'korean'),
        'visitedPreference', 'all'
      )
    )
    RETURNING id INTO recommended_parcours_id;

    -- Current parcours: prioritize French restaurants, fallback to any restaurants
    INSERT INTO public.parcours_items (
      parcours_id,
      restaurant_id,
      item_order,
      points,
      is_completed,
      reservation_url
    )
    SELECT
      current_parcours_id,
      r.id::text,
      ranked.item_order,
      COALESCE(r.point_value, 25),
      ranked.item_order = 1,
      NULLIF(r.booking_url, '')
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(michelin_stars, 0) DESC, name ASC) AS item_order
      FROM public.restaurants
      WHERE
        COALESCE(status, 'Published') = 'Published'
        AND (
          LOWER(COALESCE(cuisine_type, '')) LIKE '%fran%'
          OR LOWER(COALESCE(cuisine_type, '')) LIKE '%french%'
          OR LOWER(COALESCE(description, '')) LIKE '%bistro%'
        )
      LIMIT 7
    ) ranked
    JOIN public.restaurants r ON r.id = ranked.id;

    -- Fill missing rows up to 7 if French subset is too small
    INSERT INTO public.parcours_items (
      parcours_id,
      restaurant_id,
      item_order,
      points,
      is_completed,
      reservation_url
    )
    SELECT
      current_parcours_id,
      r.id::text,
      extras.item_order,
      COALESCE(r.point_value, 25),
      false,
      NULLIF(r.booking_url, '')
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(michelin_stars, 0) DESC, name ASC) +
        COALESCE((SELECT MAX(item_order) FROM public.parcours_items WHERE parcours_id = current_parcours_id), 0) AS item_order
      FROM public.restaurants
      WHERE
        COALESCE(status, 'Published') = 'Published'
        AND id::text NOT IN (
          SELECT restaurant_id
          FROM public.parcours_items
          WHERE parcours_id = current_parcours_id
        )
      LIMIT GREATEST(
        0,
        7 - COALESCE((SELECT COUNT(*) FROM public.parcours_items WHERE parcours_id = current_parcours_id), 0)
      )
    ) extras
    JOIN public.restaurants r ON r.id = extras.id;

    -- Recommended parcours: prioritize Asian restaurants, fallback to any remaining restaurants
    INSERT INTO public.parcours_items (
      parcours_id,
      restaurant_id,
      item_order,
      points,
      is_completed,
      reservation_url
    )
    SELECT
      recommended_parcours_id,
      r.id::text,
      ranked.item_order,
      COALESCE(r.point_value, 25),
      false,
      NULLIF(r.booking_url, '')
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(michelin_stars, 0) DESC, name ASC) AS item_order
      FROM public.restaurants
      WHERE
        COALESCE(status, 'Published') = 'Published'
        AND (
          LOWER(COALESCE(cuisine_type, '')) LIKE '%asia%'
          OR LOWER(COALESCE(cuisine_type, '')) LIKE '%japan%'
          OR LOWER(COALESCE(cuisine_type, '')) LIKE '%chinese%'
          OR LOWER(COALESCE(cuisine_type, '')) LIKE '%thai%'
          OR LOWER(COALESCE(cuisine_type, '')) LIKE '%korean%'
        )
        AND id::text NOT IN (
          SELECT restaurant_id
          FROM public.parcours_items
          WHERE parcours_id = current_parcours_id
        )
      LIMIT 5
    ) ranked
    JOIN public.restaurants r ON r.id = ranked.id;

    -- Fill missing rows up to 5 for recommended
    INSERT INTO public.parcours_items (
      parcours_id,
      restaurant_id,
      item_order,
      points,
      is_completed,
      reservation_url
    )
    SELECT
      recommended_parcours_id,
      r.id::text,
      extras.item_order,
      COALESCE(r.point_value, 25),
      false,
      NULLIF(r.booking_url, '')
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(michelin_stars, 0) DESC, name ASC) +
        COALESCE((SELECT MAX(item_order) FROM public.parcours_items WHERE parcours_id = recommended_parcours_id), 0) AS item_order
      FROM public.restaurants
      WHERE
        COALESCE(status, 'Published') = 'Published'
        AND id::text NOT IN (
          SELECT restaurant_id
          FROM public.parcours_items
          WHERE parcours_id IN (current_parcours_id, recommended_parcours_id)
        )
      LIMIT GREATEST(
        0,
        5 - COALESCE((SELECT COUNT(*) FROM public.parcours_items WHERE parcours_id = recommended_parcours_id), 0)
      )
    ) extras
    JOIN public.restaurants r ON r.id = extras.id;

    -- Recompute stats on both parcours
    UPDATE public.parcours p
    SET
      addresses_count = stats.cnt,
      total_points = stats.total_points,
      collected_points = stats.collected_points,
      completion_percentage = stats.completion
    FROM (
      SELECT
        parcours_id,
        COUNT(*)::int AS cnt,
        COALESCE(SUM(points), 0)::int AS total_points,
        COALESCE(SUM(CASE WHEN is_completed THEN points ELSE 0 END), 0)::int AS collected_points,
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100)::int
        END AS completion
      FROM public.parcours_items
      WHERE parcours_id IN (current_parcours_id, recommended_parcours_id)
      GROUP BY parcours_id
    ) stats
    WHERE p.id = stats.parcours_id;
  END LOOP;
END $$;
