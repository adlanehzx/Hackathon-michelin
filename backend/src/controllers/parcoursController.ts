import { Request, Response } from "express";
import { supabase } from "../config/supabase";

type Mode = "parcours" | "ponctuel";

interface ParcoursFilters {
  mode: Mode;
  searchType?: "parcours" | "ponctuel";
  countries?: string[];
  cities?: string[];
  establishmentTypes?: string[];
  distinctions?: string[];
  occasions?: string[];
  weather?: "soleil" | "couvert" | "both";
  cuisines?: string[];
  diets?: string[];
  priceRanges?: string[];
  locationQuery?: string;
  radiusKm?: number;
  userLatitude?: number;
  userLongitude?: number;
  peopleCount?: number;
  dateChoiceType?: "jour" | "periode";
  startDate?: string;
  endDate?: string;
  services?: string[];
  visitedPreference?: "visited" | "new" | "all";
  chefSelection?: string;
  userId?: string;
}

interface RestaurantRecord {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  city?: string;
  area?: string;
  country?: string;
  image_url?: string;
  booking_url?: string;
  price_range?: string;
  michelin_award?: string;
  michelin_stars?: number;
  cuisine_type?: string;
  establishment_type?: string;
  occasion_tags?: string[];
  weather_setup?: string;
  diet_options?: string[];
  service_options?: string[];
  chef_selection_label?: string;
  capacity_min?: number;
  capacity_max?: number;
  point_value?: number;
}

interface ParcoursItemResponse {
  restaurantId: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  priceRange: string;
  isCompleted: boolean;
  reservationUrl: string;
  points: number;
}

interface ParcoursResponse {
  id: string;
  title: string;
  subtitle: string;
  completionPercentage: number;
  collectedPoints: number;
  totalPoints: number;
  addressesCount: number;
  items: ParcoursItemResponse[];
  status: "in_progress" | "recommended" | "completed";
}

const fallbackRestaurants: RestaurantRecord[] = [
  {
    id: "mock-1",
    name: "Fana",
    city: "Paris (18)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "francaise",
    establishment_type: "restaurant",
    point_value: 30,
  },
  {
    id: "mock-2",
    name: "Baca'v",
    city: "Paris (5)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "francaise",
    establishment_type: "restaurant",
    point_value: 20,
  },
  {
    id: "mock-3",
    name: "Kodawari Ramen",
    city: "Paris (6)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€",
    cuisine_type: "japonaise",
    establishment_type: "restaurant",
    point_value: 25,
  },
  {
    id: "mock-4",
    name: "La Table d'Eugene",
    city: "Paris (6)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€€",
    cuisine_type: "francaise",
    establishment_type: "restaurant",
    point_value: 30,
  },
  {
    id: "mock-5",
    name: "Maison Bistrot",
    city: "Paris (2)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "francaise",
    establishment_type: "restaurant",
    point_value: 20,
  },
  {
    id: "mock-6",
    name: "Atelier Asiatique",
    city: "Paris (11)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 20,
  },
  {
    id: "mock-7",
    name: "Comptoir Bastille",
    city: "Paris (11)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "francaise",
    establishment_type: "restaurant",
    point_value: 20,
  },
  {
    id: "mock-8",
    name: "Nouille Club",
    city: "Paris (3)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 25,
  },
  {
    id: "mock-9",
    name: "Dragon Atelier",
    city: "Paris (10)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 25,
  },
  {
    id: "mock-10",
    name: "Sakura Table",
    city: "Paris (9)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 25,
  },
  {
    id: "mock-11",
    name: "Umami Place",
    city: "Paris (2)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 25,
  },
  {
    id: "mock-12",
    name: "Bao District",
    city: "Paris (12)",
    country: "France",
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
    booking_url: "https://guide.michelin.com",
    price_range: "€€",
    cuisine_type: "asiatique",
    establishment_type: "restaurant",
    point_value: 25,
  },
];

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim().toLowerCase())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const normalizeFilters = (body: Record<string, unknown>): ParcoursFilters => {
  const rawMode = body.mode === "ponctuel" ? "ponctuel" : "parcours";
  const rawDateChoiceType = body.dateChoiceType === "jour" ? "jour" : "periode";
  const weatherValue = body.weather;
  const weather: "soleil" | "couvert" | "both" =
    weatherValue === "soleil" || weatherValue === "couvert" ? weatherValue : "both";

  const visitedPreferenceValue = body.visitedPreference;
  const visitedPreference: "visited" | "new" | "all" =
    visitedPreferenceValue === "visited" || visitedPreferenceValue === "new"
      ? visitedPreferenceValue
      : "all";

  return {
    mode: rawMode,
    searchType: rawMode,
    countries: toStringArray(body.countries),
    cities: toStringArray(body.cities),
    establishmentTypes: toStringArray(body.establishmentTypes),
    distinctions: toStringArray(body.distinctions),
    occasions: toStringArray(body.occasions),
    weather,
    cuisines: toStringArray(body.cuisines),
    diets: toStringArray(body.diets),
    priceRanges: toStringArray(body.priceRanges),
    locationQuery: typeof body.locationQuery === "string" ? body.locationQuery : undefined,
    radiusKm: typeof body.radiusKm === "number" ? body.radiusKm : 10,
    userLatitude:
      typeof body.userLatitude === "number" && Number.isFinite(body.userLatitude)
        ? body.userLatitude
        : undefined,
    userLongitude:
      typeof body.userLongitude === "number" && Number.isFinite(body.userLongitude)
        ? body.userLongitude
        : undefined,
    peopleCount: typeof body.peopleCount === "number" ? body.peopleCount : 2,
    dateChoiceType: rawDateChoiceType,
    startDate: typeof body.startDate === "string" ? body.startDate : undefined,
    endDate: typeof body.endDate === "string" ? body.endDate : undefined,
    services: toStringArray(body.services),
    visitedPreference,
    chefSelection: typeof body.chefSelection === "string" ? body.chefSelection : undefined,
    userId: typeof body.userId === "string" ? body.userId : undefined,
  };
};

const scoreRestaurant = (restaurant: RestaurantRecord, filters: ParcoursFilters) => {
  let score = 0;

  const cuisine = (restaurant.cuisine_type || "").toLowerCase();
  const country = (restaurant.country || "").toLowerCase();
  const distinction =
    restaurant.michelin_award?.toLowerCase() ||
    (restaurant.michelin_stars ? `${restaurant.michelin_stars} star` : "");
  const establishmentType = (restaurant.establishment_type || "restaurant").toLowerCase();
  const weatherSetup = (restaurant.weather_setup || "").toLowerCase();
  const chefLabel = (restaurant.chef_selection_label || "").toLowerCase();

  if (filters.cuisines && filters.cuisines.length > 0 && filters.cuisines.includes(cuisine)) {
    score += 3;
  }

  if (
    filters.countries &&
    filters.countries.length > 0 &&
    filters.countries.some((entry) => country.includes(entry))
  ) {
    score += 3;
  }

  if (
    filters.distinctions &&
    filters.distinctions.length > 0 &&
    filters.distinctions.some((entry) => distinction.includes(entry))
  ) {
    score += 4;
  }

  if (
    filters.establishmentTypes &&
    filters.establishmentTypes.length > 0 &&
    filters.establishmentTypes.some((entry) => establishmentType.includes(entry))
  ) {
    score += 3;
  }

  if (
    filters.weather !== "both" &&
    weatherSetup.length > 0 &&
    weatherSetup.includes(filters.weather || "")
  ) {
    score += 2;
  }

  if (filters.chefSelection && chefLabel.includes(filters.chefSelection.toLowerCase())) {
    score += 2;
  }

  if (filters.priceRanges && filters.priceRanges.length > 0) {
    const priceRange = (restaurant.price_range || "").toLowerCase();
    if (filters.priceRanges.some((entry) => priceRange.includes(entry))) {
      score += 2;
    }
  }

  return score;
};

const filterRestaurantsByPreferences = async (
  restaurants: RestaurantRecord[],
  filters: ParcoursFilters
) => {
  const haversineDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const visitedIds = new Set<string>();

  if (filters.userId) {
    const { data } = await supabase
      .from("restaurant_visits")
      .select("restaurant_id")
      .eq("user_id", filters.userId);

    for (const row of data || []) {
      if (row.restaurant_id) {
        visitedIds.add(String(row.restaurant_id));
      }
    }
  }

  return restaurants.filter((restaurant) => {
    const searchableLocation = `${restaurant.city || ""} ${restaurant.area || ""} ${restaurant.country || ""}`.toLowerCase();
    const restaurantType = (restaurant.establishment_type || "restaurant").toLowerCase();
    const cuisineType = (restaurant.cuisine_type || "").toLowerCase();
    const country = (restaurant.country || "").toLowerCase();
    const city = (restaurant.city || restaurant.area || "").toLowerCase();
    const distinction = `${restaurant.michelin_award || ""} ${restaurant.michelin_stars || ""}`.toLowerCase();
    const occasions = toStringArray(restaurant.occasion_tags || []);
    const diets = toStringArray(restaurant.diet_options || []);
    const services = toStringArray(restaurant.service_options || []);
    const weather = (restaurant.weather_setup || "").toLowerCase();
    const chefSelectionLabel = (restaurant.chef_selection_label || "").toLowerCase();
    const isVisited = visitedIds.has(restaurant.id);

    const matchesLocation =
      !filters.locationQuery ||
      searchableLocation.includes(filters.locationQuery.toLowerCase()) ||
      restaurant.name.toLowerCase().includes(filters.locationQuery.toLowerCase());

    const hasUserCoords =
      typeof filters.userLatitude === "number" &&
      typeof filters.userLongitude === "number";
    const hasRestaurantCoords =
      typeof restaurant.lat === "number" && typeof restaurant.lng === "number";

    const matchesRadius =
      !hasUserCoords ||
      !hasRestaurantCoords ||
      haversineDistanceKm(
        filters.userLatitude as number,
        filters.userLongitude as number,
        restaurant.lat as number,
        restaurant.lng as number
      ) <= (filters.radiusKm || 10);

    const matchesType =
      !filters.establishmentTypes ||
      filters.establishmentTypes.length === 0 ||
      filters.establishmentTypes.some((entry) => restaurantType.includes(entry));

    const matchesCountry =
      !filters.countries ||
      filters.countries.length === 0 ||
      filters.countries.some((entry) => country.includes(entry));

    const matchesCity =
      !filters.cities ||
      filters.cities.length === 0 ||
      filters.cities.some((entry) => city.includes(entry));

    const matchesCuisine =
      !filters.cuisines ||
      filters.cuisines.length === 0 ||
      filters.cuisines.some((entry) => cuisineType.includes(entry));

    const matchesDistinction =
      !filters.distinctions ||
      filters.distinctions.length === 0 ||
      filters.distinctions.some((entry) => distinction.includes(entry));

    const matchesOccasion =
      !filters.occasions ||
      filters.occasions.length === 0 ||
      filters.occasions.some((entry) => occasions.includes(entry));

    const matchesDiet =
      !filters.diets ||
      filters.diets.length === 0 ||
      filters.diets.some((entry) => diets.includes(entry));

    const matchesServices =
      !filters.services ||
      filters.services.length === 0 ||
      filters.services.some((entry) => services.includes(entry));

    const matchesWeather =
      !filters.weather ||
      filters.weather === "both" ||
      weather.includes(filters.weather);

    const matchesChefSelection =
      !filters.chefSelection ||
      chefSelectionLabel.includes(filters.chefSelection.toLowerCase());

    const matchesVisited =
      !filters.visitedPreference ||
      filters.visitedPreference === "all" ||
      (filters.visitedPreference === "visited" && isVisited) ||
      (filters.visitedPreference === "new" && !isVisited);

    const minCapacity = restaurant.capacity_min || 1;
    const maxCapacity = restaurant.capacity_max || 100;
    const matchesPeople =
      !filters.peopleCount ||
      (filters.peopleCount >= minCapacity && filters.peopleCount <= maxCapacity);

    const matchesPrice =
      !filters.priceRanges ||
      filters.priceRanges.length === 0 ||
      filters.priceRanges.some((entry) =>
        (restaurant.price_range || "").toLowerCase().includes(entry)
      );

    return (
      matchesLocation &&
      matchesCountry &&
      matchesCity &&
      matchesType &&
      matchesCuisine &&
      matchesDistinction &&
      matchesOccasion &&
      matchesDiet &&
      matchesServices &&
      matchesWeather &&
      matchesChefSelection &&
      matchesVisited &&
      matchesPeople &&
      matchesPrice &&
      matchesRadius
    );
  });
};

const toParcoursItems = (
  restaurants: RestaurantRecord[],
  completedRestaurantIds: Set<string>
): ParcoursItemResponse[] => {
  return restaurants.map((restaurant) => ({
    restaurantId: restaurant.id,
    name: restaurant.name,
    city: restaurant.city || restaurant.area || "Paris",
    country: restaurant.country || "France",
    imageUrl: restaurant.image_url || "",
    priceRange: restaurant.price_range || "€€",
    isCompleted: completedRestaurantIds.has(restaurant.id),
    reservationUrl: restaurant.booking_url || "",
    points: restaurant.point_value || 25,
  }));
};

const summarizeParcours = (
  id: string,
  title: string,
  status: "in_progress" | "recommended" | "completed",
  items: ParcoursItemResponse[]
): ParcoursResponse => {
  const completedItems = items.filter((item) => item.isCompleted);
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const collectedPoints = completedItems.reduce((sum, item) => sum + item.points, 0);
  const completionPercentage =
    items.length === 0 ? 0 : Math.round((completedItems.length / items.length) * 100);

  return {
    id,
    title,
    subtitle: `${items.length} adresses - ${totalPoints} points à récolter`,
    completionPercentage,
    collectedPoints,
    totalPoints,
    addressesCount: items.length,
    items,
    status,
  };
};

const buildParcoursFromFilters = async (filters: ParcoursFilters) => {
  const { data, error } = await supabase.from("restaurants").select("*").limit(300);

  if (error) {
    throw new Error(error.message);
  }

  const restaurants = (data || []) as RestaurantRecord[];
  const filtered = await filterRestaurantsByPreferences(restaurants, filters);

  const ordered = filtered
    .slice()
    .sort((left, right) => scoreRestaurant(right, filters) - scoreRestaurant(left, filters));

  const effectiveRestaurants = ordered.length > 0 ? ordered : fallbackRestaurants;

  const inProgressCount = filters.mode === "ponctuel" ? 2 : 7;
  const recommendedCount = filters.mode === "ponctuel" ? 2 : 5;

  const inProgressRestaurants = effectiveRestaurants.slice(0, inProgressCount);
  const recommendedRestaurants = effectiveRestaurants.slice(
    inProgressCount,
    inProgressCount + recommendedCount
  );

  const firstCompletedId = inProgressRestaurants[0]?.id;
  const completedIds = new Set<string>(firstCompletedId ? [firstCompletedId] : []);

  const inProgress = summarizeParcours(
    "suggested-current",
    filters.mode === "ponctuel" ? "Recherche du jour" : "Parcours bistrots français",
    "in_progress",
    toParcoursItems(inProgressRestaurants, completedIds)
  );

  const recommended = summarizeParcours(
    "suggested-recommended",
    "Parcours asiatiques",
    "recommended",
    toParcoursItems(recommendedRestaurants, new Set())
  );

  return {
    filters,
    inProgress,
    recommended,
  };
};

const saveParcoursInDatabase = async (
  userId: string,
  filters: ParcoursFilters,
  parcours: ParcoursResponse,
  status: "in_progress" | "recommended"
) => {
  const { data: createdParcours, error: parcoursError } = await supabase
    .from("parcours")
    .insert([
      {
        user_id: userId,
        title: parcours.title,
        status,
        mode: filters.mode,
        date_choice_type: filters.dateChoiceType || "periode",
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        filters: filters,
        addresses_count: parcours.addressesCount,
        total_points: parcours.totalPoints,
        collected_points: parcours.collectedPoints,
        completion_percentage: parcours.completionPercentage,
      },
    ])
    .select("id")
    .single();

  if (parcoursError || !createdParcours) {
    throw new Error(parcoursError?.message || "Impossible de créer le parcours");
  }

  if (parcours.items.length === 0) {
    return createdParcours.id as string;
  }

  const rows = parcours.items.map((item, index) => ({
    parcours_id: createdParcours.id,
    restaurant_id: item.restaurantId,
    item_order: index,
    points: item.points,
    is_completed: item.isCompleted,
    reservation_url: item.reservationUrl || null,
  }));

  const { error: itemsError } = await supabase.from("parcours_items").insert(rows);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return createdParcours.id as string;
};

const isMissingParcoursTablesError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation") ||
    normalized.includes("parcours") ||
    normalized.includes("does not exist") ||
    normalized.includes("not found")
  );
};

export const suggestParcours = async (req: Request, res: Response) => {
  try {
    const filters = normalizeFilters(req.body || {});
    const suggestions = await buildParcoursFromFilters(filters);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suggestion de parcours",
      error: error.message,
    });
  }
};

export const createParcours = async (req: Request, res: Response) => {
  try {
    const filters = normalizeFilters(req.body || {});
    const userId = filters.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId est obligatoire pour créer un parcours",
      });
    }

    const suggestions = await buildParcoursFromFilters(filters);
    const inProgressId = await saveParcoursInDatabase(
      userId,
      filters,
      suggestions.inProgress,
      "in_progress"
    );
    const recommendedId = await saveParcoursInDatabase(
      userId,
      filters,
      suggestions.recommended,
      "recommended"
    );

    return res.status(201).json({
      success: true,
      data: {
        inProgressId,
        recommendedId,
        parcours: suggestions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du parcours",
      error: error.message,
    });
  }
};

export const getUserParcours = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: parcoursRows, error: parcoursError } = await supabase
      .from("parcours")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (parcoursError) {
      if (isMissingParcoursTablesError(parcoursError.message)) {
        const suggestions = await buildParcoursFromFilters({ mode: "parcours", userId });
        return res.status(200).json({
          success: true,
          data: suggestions,
          fallback: true,
        });
      }

      throw new Error(parcoursError.message);
    }

    if (!parcoursRows || parcoursRows.length === 0) {
      const suggestions = await buildParcoursFromFilters({ mode: "parcours", userId });
      return res.status(200).json({
        success: true,
        data: suggestions,
        fallback: true,
      });
    }

    const parcoursIds = parcoursRows.map((row) => row.id);

    const { data: itemsRows, error: itemsError } = await supabase
      .from("parcours_items")
      .select("*")
      .in("parcours_id", parcoursIds)
      .order("item_order", { ascending: true });

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const restaurantIds = Array.from(
      new Set((itemsRows || []).map((item) => String(item.restaurant_id)))
    );

    const { data: restaurantsRows, error: restaurantsError } = await supabase
      .from("restaurants")
      .select("*")
      .in("id", restaurantIds);

    if (restaurantsError) {
      throw new Error(restaurantsError.message);
    }

    const restaurantById = new Map<string, RestaurantRecord>();
    for (const restaurant of (restaurantsRows || []) as RestaurantRecord[]) {
      restaurantById.set(String(restaurant.id), restaurant);
    }

    const itemsByParcoursId = new Map<string, ParcoursItemResponse[]>();
    for (const item of itemsRows || []) {
      const restaurant = restaurantById.get(String(item.restaurant_id));
      if (!restaurant) {
        continue;
      }

      const row: ParcoursItemResponse = {
        restaurantId: String(item.restaurant_id),
        name: restaurant.name,
        city: restaurant.city || restaurant.area || "Paris",
        country: restaurant.country || "France",
        imageUrl: restaurant.image_url || "",
        priceRange: restaurant.price_range || "€€",
        isCompleted: Boolean(item.is_completed),
        reservationUrl: item.reservation_url || restaurant.booking_url || "",
        points: item.points || restaurant.point_value || 25,
      };

      const existing = itemsByParcoursId.get(String(item.parcours_id)) || [];
      existing.push(row);
      itemsByParcoursId.set(String(item.parcours_id), existing);
    }

    const inProgressRow = parcoursRows.find((row) => row.status === "in_progress");
    const recommendedRow = parcoursRows.find((row) => row.status === "recommended");

    const inProgress = inProgressRow
      ? summarizeParcours(
          String(inProgressRow.id),
          inProgressRow.title || "Parcours en cours",
          "in_progress",
          itemsByParcoursId.get(String(inProgressRow.id)) || []
        )
      : summarizeParcours("fallback-current", "Parcours en cours", "in_progress", []);

    const recommended = recommendedRow
      ? summarizeParcours(
          String(recommendedRow.id),
          recommendedRow.title || "Parcours recommandé",
          "recommended",
          itemsByParcoursId.get(String(recommendedRow.id)) || []
        )
      : summarizeParcours("fallback-recommended", "Parcours recommandé", "recommended", []);

    return res.status(200).json({
      success: true,
      data: {
        filters: inProgressRow?.filters || {},
        inProgress,
        recommended,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des parcours",
      error: error.message,
    });
  }
};

export const completeParcoursStop = async (req: Request, res: Response) => {
  try {
    const { parcoursId, restaurantId } = req.params;
    const { userId } = req.body as { userId?: string };

    const { error: itemError } = await supabase
      .from("parcours_items")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("parcours_id", parcoursId)
      .eq("restaurant_id", restaurantId);

    if (itemError) {
      throw new Error(itemError.message);
    }

    const { data: items, error: fetchError } = await supabase
      .from("parcours_items")
      .select("points, is_completed")
      .eq("parcours_id", parcoursId);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const totalPoints = (items || []).reduce(
      (sum, row) => sum + Number(row.points || 0),
      0
    );
    const collectedPoints = (items || [])
      .filter((row) => Boolean(row.is_completed))
      .reduce((sum, row) => sum + Number(row.points || 0), 0);
    const completionPercentage =
      (items || []).length === 0
        ? 0
        : Math.round(
            ((items || []).filter((row) => Boolean(row.is_completed)).length /
              (items || []).length) *
              100
          );

    await supabase
      .from("parcours")
      .update({
        collected_points: collectedPoints,
        total_points: totalPoints,
        completion_percentage: completionPercentage,
        status: completionPercentage === 100 ? "completed" : "in_progress",
      })
      .eq("id", parcoursId);

    if (userId) {
      await supabase.from("restaurant_visits").upsert(
        {
          user_id: userId,
          restaurant_id: restaurantId,
          visited_at: new Date().toISOString(),
          source: "parcours",
        },
        { onConflict: "user_id,restaurant_id" }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        completionPercentage,
        collectedPoints,
        totalPoints,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la validation de l'étape",
      error: error.message,
    });
  }
};

export const getParcoursFilterOptions = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("restaurants").select("*").limit(500);

    if (error) {
      throw new Error(error.message);
    }

    const restaurants = (data || []) as RestaurantRecord[];

    const countries = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.country)
          .filter((value): value is string => Boolean(value && value.length > 0))
          .map((value) => value.trim())
      )
    ).sort();

    const cities = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.city || restaurant.area)
          .filter((value): value is string => Boolean(value && value.length > 0))
          .map((value) => value.trim())
      )
    ).sort();

    const establishmentTypes = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.establishment_type)
          .filter((value): value is string => Boolean(value && value.length > 0))
          .map((value) => value.trim().toLowerCase())
      )
    ).sort();

    const cuisines = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.cuisine_type)
          .filter((value): value is string => Boolean(value && value.length > 0))
      )
    ).sort();

    const priceRanges = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.price_range)
          .filter((value): value is string => Boolean(value && value.length > 0))
      )
    ).sort();

    const distinctions = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.michelin_award || `${restaurant.michelin_stars || ""}`)
          .filter((value): value is string => Boolean(value && value.length > 0))
      )
    ).sort();

    return res.status(200).json({
      success: true,
      data: {
        modes: ["parcours", "ponctuel"],
        countries,
        cities,
        establishmentTypes,
        weather: ["soleil", "couvert", "both"],
        visitedPreference: ["all", "visited", "new"],
        cuisines,
        priceRanges,
        distinctions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des options de filtres",
      error: error.message,
    });
  }
};