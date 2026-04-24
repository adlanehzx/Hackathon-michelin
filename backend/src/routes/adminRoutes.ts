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

adminRouter.get("/users", authMiddleware, adminAuthMiddleware, listAllUsers);

adminRouter.post("/users", authMiddleware, adminAuthMiddleware, createUser);

adminRouter.put("/users/:id", authMiddleware, adminAuthMiddleware, updateUser);

adminRouter.post(
  "/users/:id/promote",
  authMiddleware,
  adminAuthMiddleware,
  promoteUser,
);

adminRouter.post(
  "/users/:id/demote",
  authMiddleware,
  adminAuthMiddleware,
  demoteUser,
);

adminRouter.delete(
  "/users/:id",
  authMiddleware,
  adminAuthMiddleware,
  deleteUser,
);

export default adminRouter;
