import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getAllLevels = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("levels")
      .select("*")
      .order("level_number", { ascending: true });

    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
