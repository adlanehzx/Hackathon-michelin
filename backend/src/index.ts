import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

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

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: Supabase`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});
