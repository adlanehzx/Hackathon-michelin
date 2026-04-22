import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des restaurants",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Restaurant non trouvé",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

export const getRestaurantsByLocation = async (
  req: Request,
  res: Response
) => {
  try {
    const { latitude, longitude, distance } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres latitude et longitude sont requis",
      });
    }

    // Récupérer tous les restaurants et filtrer côté serveur
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .not("lat", "is", null)
      .not("lng", "is", null);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des restaurants",
        error: error.message,
      });
    }

    // Fonction pour calculer la distance entre deux coordonnées (formule de Haversine)
    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const R = 6371; // Rayon de la Terre en km
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

    const maxDistance = distance ? parseFloat(distance as string) : 50;
    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

    const filteredData = (data || []).filter((restaurant: any) => {
      const dist = calculateDistance(lat, lon, restaurant.lat, restaurant.lng);
      return dist <= maxDistance;
    });

    return res.status(200).json({
      success: true,
      data: filteredData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
