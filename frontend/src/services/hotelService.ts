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

export interface Hotel {
  id: number;
  object_id?: string;
  name: string;
  city?: string;
  country?: string;
  region?: string;
  lat?: number;
  lng?: number;
  address?: string;
  postal_code?: string;
  num_rooms?: number;
  num_reviews?: number;
  rating?: string;
  main_image?: string;
  sustainable?: boolean;
  michelin_url?: string;
  created_at?: string;
  updated_at?: string;
}

class HotelService {
  async getAllHotels(): Promise<Hotel[]> {
    try {
      const response = await axios.get(`${API_URL}/hotels`);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des hôtels:", error);
      throw error.response?.data || error;
    }
  }

  async getHotelById(id: string | number): Promise<Hotel> {
    try {
      const response = await axios.get(`${API_URL}/hotels/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Erreur lors de la récupération de l'hôtel:", error);
      throw error.response?.data || error;
    }
  }

  async getHotelsByLocation(
    latitude: number,
    longitude: number,
    distance: number = 50,
  ): Promise<Hotel[]> {
    try {
      const response = await axios.get(`${API_URL}/hotels/location`, {
        params: {
          latitude,
          longitude,
          distance,
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des hôtels:", error);
      throw error.response?.data || error;
    }
  }

  async searchHotels(
    query: string,
    country?: string,
    sustainable?: boolean,
  ): Promise<Hotel[]> {
    try {
      const params: any = { query };
      if (country) params.country = country;
      if (typeof sustainable === "boolean") params.sustainable = sustainable;

      const response = await axios.get(`${API_URL}/hotels/search`, {
        params,
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Erreur lors de la recherche:", error);
      return [];
    }
  }
}

export const hotelService = new HotelService();
