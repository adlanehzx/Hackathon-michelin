import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/index";

const adminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Non authentifié" });
  }

  if (!req.user.is_admin) {
    return res
      .status(403)
      .json({ success: false, error: "Accès refusé: droits admin requis" });
  }

  next();
};

export default adminAuthMiddleware;
