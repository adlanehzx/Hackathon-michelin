import { Router } from "express";
import authMiddleware from "../middleware/auth";
import adminAuthMiddleware from "../middleware/adminAuth";
import {
  listAllUsers,
  createUser,
  updateUser,
  promoteUser,
  demoteUser,
  deleteUser,
} from "../controllers/adminController";

const adminRouter = Router();

// GET /admin/users - Lister tous les utilisateurs
adminRouter.get("/users", authMiddleware, adminAuthMiddleware, listAllUsers);

// POST /admin/users - Créer un utilisateur
adminRouter.post("/users", authMiddleware, adminAuthMiddleware, createUser);

// PUT /admin/users/:id - Modifier un utilisateur
adminRouter.put("/users/:id", authMiddleware, adminAuthMiddleware, updateUser);

// POST /admin/users/:id/promote - Promouvoir en admin
adminRouter.post(
  "/users/:id/promote",
  authMiddleware,
  adminAuthMiddleware,
  promoteUser,
);

// POST /admin/users/:id/demote - Rétrograder
adminRouter.post(
  "/users/:id/demote",
  authMiddleware,
  adminAuthMiddleware,
  demoteUser,
);

// DELETE /admin/users/:id - Supprimer un utilisateur
adminRouter.delete(
  "/users/:id",
  authMiddleware,
  adminAuthMiddleware,
  deleteUser,
);

export default adminRouter;
