import { Request, Response } from "express";
import { supabase } from "../config/supabase";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, nom, prenom, email, telephone, adresse, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data?.length || 0,
      data: data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, nom, prenom, email, telephone, adresse, created_at")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: "Vous ne pouvez modifier que votre propre profil",
      });
    }

    const { nom, prenom, telephone, adresse } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        nom,
        prenom,
        telephone,
        adresse,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: "Profil mis à jour",
      data: data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: "Vous ne pouvez supprimer que votre propre compte",
      });
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ success: true, message: "Compte supprimé" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
