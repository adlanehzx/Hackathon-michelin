import axios from "axios";
import { Platform } from "react-native";

const getApiUrl = () => {
  const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
  const mobileUrl = process.env.EXPO_PUBLIC_API_URL_MOBILE;
  const fallbackUrl = process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === "web") {
    if (webUrl) {
      return webUrl;
    }

    if (fallbackUrl) {
      return fallbackUrl;
    }

    return "http://localhost:3000/api";
  }

  if (mobileUrl) {
    return mobileUrl;
  }

  if (fallbackUrl) {
    return fallbackUrl;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
};

const API_URL = getApiUrl();

/**
 * Structure des restaurants provenant de Supabase
 * Table: restaurants
 * Source: Michelin Guide
 */
export interface Restaurant {
  // Identifiants
  id: string;
  michelin_id?: string;
  slug?: string;

  // Informations principales
  name: string;
  chef?: string;
  description?: string;

  // Localisation
  street?: string;
  city?: string;
  area?: string;
  country?: string;
  postcode?: string | null;
  lat?: number; // Latitude
  lng?: number; // Longitude
  country_code?: string;

  // Contact et web
  phone?: string;
  website?: string;
  booking_url?: string;
  online_booking?: boolean;
  short_link?: string;

  // Cuisine et tarifs
  cuisine_type?: string;
  price_range?: string; // luxury, expensive, moderate, etc.

  // Distinctions Michelin
  michelin_stars?: number;
  michelin_award?: string; // ONE_STAR, TWO_STARS, THREE_STARS
  green_star?: boolean;
  is_bib_gourmand?: boolean;

  // Médias
  image_url?: string;

  // Métadonnées
  guide_year?: number;
  status?: string; // Published, etc.
  created_at?: string;
}

class RestaurantService {
  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await axios.get(`${API_URL}/restaurants`);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des restaurants:", error);
      throw error.response?.data || error;
    }
  }

  async getRestaurantById(id: string): Promise<Restaurant> {
    try {
      const response = await axios.get(`${API_URL}/restaurants/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Erreur lors de la récupération du restaurant:", error);
      throw error.response?.data || error;
    }
  }

  async getRestaurantsByLocation(
    latitude: number,
    longitude: number,
    distance: number = 50,
  ): Promise<Restaurant[]> {
    try {
      const response = await axios.get(`${API_URL}/restaurants/location`, {
        params: {
          latitude,
          longitude,
          distance,
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des restaurants:", error);
      throw error.response?.data || error;
    }
  }

  async searchRestaurants(
    query: string,
    cuisineType?: string,
    michelin?: number,
  ): Promise<Restaurant[]> {
    try {
      const params: any = { query };
      if (cuisineType) params.cuisineType = cuisineType;
      if (michelin) params.michelin = michelin;

      const response = await axios.get(`${API_URL}/restaurants/search`, {
        params,
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      return [];
    }
  }
}

export const restaurantService = new RestaurantService();
