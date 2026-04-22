import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase";
import { sendPasswordResetCodeEmail } from "../services/resendService";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const PASSWORD_RESET_CODE_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_CODE_TTL_MINUTES || "15",
);
const PASSWORD_RESET_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PASSWORD_RESET_CODE_LENGTH = 8;

const isDevelopmentMode = () => {
  return (process.env.NODE_ENV || "development") !== "production";
};

const authDebugLog = (message: string, meta?: Record<string, unknown>) => {
  if (!isDevelopmentMode()) {
    return;
  }

  if (meta) {
    console.log(`[AUTH DEBUG] ${message}`, meta);
    return;
  }

  console.log(`[AUTH DEBUG] ${message}`);
};

const buildPasswordResetCode = () => {
  return Array.from({ length: PASSWORD_RESET_CODE_LENGTH }, () => {
    const index = crypto.randomInt(0, PASSWORD_RESET_CODE_ALPHABET.length);
    return PASSWORD_RESET_CODE_ALPHABET[index];
  }).join("");
};

const hashPasswordResetCode = (email: string, code: string) => {
  return crypto
    .createHash("sha256")
    .update(`${email}:${code.toUpperCase()}`)
    .digest("hex");
};

export const register = async (req: Request, res: Response) => {
  try {
    const { nom, prenom, password, telephone, adresse } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "nom, prenom, email et password sont obligatoires",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit avoir au moins 8 caractères",
      });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      authDebugLog("register refused because email already exists", { email });
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
        is_admin: false,
      },
    ]);

    if (error) throw error;

    authDebugLog("register success", { email });

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
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !password) {
      authDebugLog("login rejected because email or password missing", { email });
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
      authDebugLog("login failed because user was not found", { email });
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      authDebugLog("login failed because password hash comparison failed", {
        email,
        hasPasswordHash: Boolean(user.password_hash),
      });
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

    authDebugLog("login success", { email, userId: user.id });

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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      authDebugLog("forgotPassword rejected because email missing");
      return res.status(400).json({
        success: false,
        error: "Email est obligatoire",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      authDebugLog("forgotPassword ignored because user not found", { email });
      return res.json({
        success: true,
        message:
          "Si cet email existe, un code de réinitialisation a été envoyé",
      });
    }

    const resetCode = buildPasswordResetCode();
    const hashedCode = hashPasswordResetCode(email, resetCode);
    const resetExpiration = new Date(
      Date.now() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: hashedCode,
        reset_token_expires: resetExpiration,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    authDebugLog("forgotPassword stored reset code", {
      email,
      userId: user.id,
      resetExpiration,
    });

    await sendPasswordResetCodeEmail({
      to: email,
      code: resetCode,
      expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES,
    });

    res.json({
      success: true,
      message: "Si cet email existe, un code de réinitialisation a été envoyé",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const code = req.body.code?.trim().toUpperCase();

    if (!email || !code || !newPassword) {
      authDebugLog("resetPassword rejected because payload is incomplete", {
        email,
        hasCode: Boolean(code),
        hasNewPassword: Boolean(newPassword),
      });
      return res.status(400).json({
        success: false,
        error: "Email, code et nouveau mot de passe sont obligatoires",
      });
    }

    if (newPassword.length < 8) {
      authDebugLog("resetPassword rejected because new password is too short", {
        email,
        passwordLength: newPassword.length,
      });
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit avoir au moins 8 caractères",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      authDebugLog("resetPassword failed because user not found", { email });
      return res.status(400).json({
        success: false,
        error: "Code invalide ou expiré",
      });
    }

    if (!user.reset_token || !user.reset_token_expires) {
      authDebugLog("resetPassword failed because reset code is missing in db", {
        email,
        userId: user.id,
      });
      return res.status(400).json({
        success: false,
        error: "Code invalide ou expiré",
      });
    }

    const expirationDate = new Date(user.reset_token_expires);
    if (new Date() > expirationDate) {
      authDebugLog("resetPassword failed because code expired", {
        email,
        userId: user.id,
        resetTokenExpires: user.reset_token_expires,
      });
      return res.status(400).json({
        success: false,
        error: "Code expiré",
      });
    }

    const hashedCode = hashPasswordResetCode(email, code);
    if (user.reset_token !== hashedCode) {
      authDebugLog("resetPassword failed because code hash mismatch", {
        email,
        userId: user.id,
        providedCode: code,
      });
      return res.status(400).json({
        success: false,
        error: "Code invalide ou expiré",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    authDebugLog("resetPassword success", {
      email,
      userId: user.id,
    });

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
