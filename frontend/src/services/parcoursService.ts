import axios from "axios";

const API_URL =
  typeof window !== "undefined" &&
  window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api"
    : "http://backend:3000/api";

export interface ParcoursFilters {
  mode: "parcours" | "ponctuel";
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

export interface ParcoursItem {
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

export interface ParcoursData {
  id: string;
  title: string;
  subtitle: string;
  completionPercentage: number;
  collectedPoints: number;
  totalPoints: number;
  addressesCount: number;
  items: ParcoursItem[];
  status: "in_progress" | "recommended" | "completed";
}

export interface ParcoursResponse {
  filters: Partial<ParcoursFilters>;
  inProgress: ParcoursData;
  recommended: ParcoursData;
}

class ParcoursService {
  async getUserParcours(userId: string): Promise<ParcoursResponse | null> {
    try {
      const response = await axios.get(`${API_URL}/parcours/user/${userId}`);
      return response.data.data || null;
    } catch (error) {
      console.error("Erreur lors de la récupération des parcours:", error);
      return null;
    }
  }

  async getSuggestions(filters: ParcoursFilters): Promise<ParcoursResponse | null> {
    try {
      const response = await axios.post(`${API_URL}/parcours/suggestions`, filters);
      return response.data.data || null;
    } catch (error) {
      console.error("Erreur lors de la suggestion de parcours:", error);
      return null;
    }
  }

  async createParcours(filters: ParcoursFilters): Promise<ParcoursResponse | null> {
    try {
      const response = await axios.post(`${API_URL}/parcours`, filters);
      return response.data.data?.parcours || null;
    } catch (error) {
      console.error("Erreur lors de la création du parcours:", error);
      return null;
    }
  }

  async completeStop(
    parcoursId: string,
    restaurantId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      await axios.patch(
        `${API_URL}/parcours/${parcoursId}/items/${restaurantId}/complete`,
        { userId }
      );
      return true;
    } catch (error) {
      console.error("Erreur lors de la validation de l'étape:", error);
      return false;
    }
  }

  async getFilterOptions(): Promise<{
    countries: string[];
    cities: string[];
    establishmentTypes: string[];
    visitedPreference: string[];
    cuisines: string[];
    priceRanges: string[];
    distinctions: string[];
  }> {
    try {
      const response = await axios.get(`${API_URL}/parcours/filters/options`);
      return (
        response.data.data || {
          countries: [],
          cities: [],
          establishmentTypes: [],
          visitedPreference: ["all", "visited", "new"],
          cuisines: [],
          priceRanges: [],
          distinctions: [],
        }
      );
    } catch (error) {
      console.error("Erreur lors du chargement des options:", error);
      return {
        countries: [],
        cities: [],
        establishmentTypes: [],
        visitedPreference: ["all", "visited", "new"],
        cuisines: [],
        priceRanges: [],
        distinctions: [],
      };
    }
  }
}

export const parcoursService = new ParcoursService();