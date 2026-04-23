import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../types/index";

export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const { data: badges, error } = await supabase
      .from("badges")
      .select("*")
      .order("is_final", { ascending: true });

    if (error) throw error;

    const badgesWithRequirements = await Promise.all(
      (badges || []).map(async (badge: any) => {
        const { data: requirements } = await supabase
          .from("badge_requirements")
          .select("challenge_id, challenges(id, name, difficulty, xp_reward)")
          .eq("badge_id", badge.id);

        return {
          ...badge,
          required_challenges: (requirements || []).map((r: any) => r.challenges),
        };
      })
    );

    res.json({ success: true, count: badgesWithRequirements.length, data: badgesWithRequirements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyBadges = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from("user_badges")
      .select("obtained_at, badges(*)")
      .eq("user_id", userId)
      .order("obtained_at", { ascending: false });

    if (error) throw error;

    const badges = (data || []).map((ub: any) => ({
      ...ub.badges,
      obtained_at: ub.obtained_at,
    }));

    res.json({ success: true, count: badges.length, data: badges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur introuvable" });
    }

    const { data, error } = await supabase
      .from("user_badges")
      .select("obtained_at, badges(*)")
      .eq("user_id", userId)
      .order("obtained_at", { ascending: false });

    if (error) throw error;

    const badges = (data || []).map((ub: any) => ({
      ...ub.badges,
      obtained_at: ub.obtained_at,
    }));

    res.json({ success: true, count: badges.length, data: badges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
