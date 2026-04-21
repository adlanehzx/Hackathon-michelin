const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    // Simple health check - just check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Supabase credentials not configured",
      });
    }

    res.json({
      status: "ok",
      database: "connected",
      provider: "supabase",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Michelin Hackathon API" });
});

// GET all users
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single user
app.get("/api/users/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;

    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create new user
app.post("/api/users", async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({
        success: false,
        error: "nom, prenom et email sont obligatoires",
      });
    }

    const { data, error } = await supabase.from("users").insert([
      {
        nom,
        prenom,
        email,
        telephone: telephone || null,
        adresse: adresse || null,
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "User créé avec succès",
      data: data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update user
app.put("/api/users/:id", async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        nom,
        prenom,
        email,
        telephone,
        adresse,
        updated_at: new Date(),
      })
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "User mis à jour",
      data: data,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ success: true, message: "User supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: Supabase`);
});
