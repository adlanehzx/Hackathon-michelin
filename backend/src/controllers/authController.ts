import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const register = async (req: Request, res: Response) => {
  try {
    const { nom, prenom, email, password, telephone, adresse } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "nom, prenom, email et password sont obligatoires",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit avoir au moins 6 caractères",
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

    const { data, error } = await supabase.from("users").insert([
      {
        nom,
        prenom,
        email,
        password_hash,
        telephone: telephone || null,
        adresse: adresse || null,
        is_admin: false,
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email et password sont obligatoires",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin || false },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      message: "Connecté avec succès",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        is_admin: user.is_admin || false,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Déconnecté avec succès",
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "Token manquant" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
    const { data: user, error } = await supabase
      .from("users")
      .select("id, nom, prenom, email, telephone, adresse")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(401).json({ success: false, error: "Token invalide" });
  }
};
