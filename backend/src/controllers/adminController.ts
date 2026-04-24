import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../types/index";

export const listAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id,nom,prenom,email,telephone,adresse,is_admin,created_at");

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, users: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, email, password, telephone, adresse, is_admin } =
      req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "nom, prenom, email et password sont obligatoires",
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Cet email est déjà utilisé",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("users").insert([
      {
        nom,
        prenom,
        email,
        password_hash,
        telephone: telephone || null,
        adresse: adresse || null,
        is_admin: is_admin || false,
      },
    ]);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: { nom, prenom, email, is_admin: is_admin || false },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, adresse, is_admin } = req.body;

    const updateData: any = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined) updateData.email = email;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (is_admin !== undefined) updateData.is_admin = is_admin;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucun champ à mettre à jour",
      });
    }

    if (email) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .neq("id", id)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Cet email est déjà utilisé",
        });
      }
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: "Utilisateur modifié avec succès" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const promoteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("users")
      .update({ is_admin: true })
      .eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: "Utilisateur promu en admin" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const demoteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("users")
      .update({ is_admin: false })
      .eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: "Utilisateur rétrogradé" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
