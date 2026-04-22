import axios from "axios";

const API_URL =
  typeof window !== "undefined" &&
  window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

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
    distance: number = 50
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
}

export const restaurantService = new RestaurantService();
