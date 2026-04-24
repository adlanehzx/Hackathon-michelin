import { Request, Response } from "express";
import { supabase } from "../config/supabase";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getAllHotels = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des hôtels",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: message,
    });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: message,
    });
  }
};

export const getHotelsByLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, distance } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres latitude et longitude sont requis",
      });
    }

    const lat = parseFloat(String(latitude));
    const lon = parseFloat(String(longitude));
    const maxDistance = distance ? parseFloat(String(distance)) : 50;

    if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(maxDistance)) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres de localisation sont invalides",
      });
    }

    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des hôtels",
        error: error.message,
      });
    }

    const filteredData = (data || []).filter((hotel) => {
      const hotelLat = Number(hotel.lat);
      const hotelLng = Number(hotel.lng);

      if (Number.isNaN(hotelLat) || Number.isNaN(hotelLng)) {
        return false;
      }

      const dist = calculateDistance(lat, lon, hotelLat, hotelLng);
      return dist <= maxDistance;
    });

    return res.status(200).json({
      success: true,
      data: filteredData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: message,
    });
  }
};

export const searchHotels = async (req: Request, res: Response) => {
  try {
    const { query, country, sustainable } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le paramètre query est requis",
      });
    }

    let qBuilder = supabase
      .from("hotels")
      .select("*")
      .or(
        `name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%,address.ilike.%${query}%`,
      );

    if (country && typeof country === "string") {
      qBuilder = qBuilder.ilike("country", `%${country}%`);
    }

    if (sustainable && typeof sustainable === "string") {
      const isSustainable = sustainable.toLowerCase() === "true";
      qBuilder = qBuilder.eq("sustainable", isSustainable);
    }

    const { data, error } = await qBuilder.order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: message,
    });
  }
};
