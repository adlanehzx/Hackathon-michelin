import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import hotelRoutes from "./routes/hotelRoutes";
import feedRoutes from "./routes/feedRoutes";
import parcoursRoutes from "./routes/parcoursRoutes";
import challengeRoutes from "./routes/challengeRoutes";
import badgeRoutes, { userBadgesRouter } from "./routes/badgeRoutes";
import levelRoutes from "./routes/levelRoutes";
import progressRoutes, { userProgressRouter } from "./routes/progressRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    database: "connected",
    provider: "supabase",
    timestamp: new Date().toISOString(),
  });
});

// Welcome endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Michelin Hackathon API" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/parcours", parcoursRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/users", userBadgesRouter);
app.use("/api/users", userProgressRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: Supabase`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});
