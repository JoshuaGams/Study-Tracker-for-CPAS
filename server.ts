import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Server-side persistent storage directory for multi-profile/cross-device accounts & progress
const DATA_DIR = path.join(process.cwd(), "server_data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create server_data directory:", err);
  }
}

const USERS_FILE = path.join(DATA_DIR, "users.json");

function sanitizeUserId(id: string): string {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
}

// User accounts sync endpoints
app.get("/api/users", (req, res) => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      const users = JSON.parse(content);
      return res.json({ success: true, users: Array.isArray(users) ? users : [] });
    }
    return res.json({ success: true, users: [] });
  } catch (err: any) {
    console.error("Error reading users:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/users", (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ success: false, error: "Users must be an array" });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return res.json({ success: true, count: users.length });
  } catch (err: any) {
    console.error("Error saving users:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Per-user study progress & syllabus state endpoints
app.get("/api/user-state/:userId", (req, res) => {
  try {
    const cleanId = sanitizeUserId(req.params.userId);
    const userFile = path.join(DATA_DIR, `user_state_${cleanId}.json`);
    if (fs.existsSync(userFile)) {
      const content = fs.readFileSync(userFile, "utf-8");
      const state = JSON.parse(content);
      return res.json({ success: true, state });
    }
    return res.json({ success: false, message: "No remote state for user" });
  } catch (err: any) {
    console.error("Error reading user state:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/user-state/:userId", (req, res) => {
  try {
    const cleanId = sanitizeUserId(req.params.userId);
    const userFile = path.join(DATA_DIR, `user_state_${cleanId}.json`);
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ success: false, error: "Missing state in request body" });
    }
    fs.writeFileSync(userFile, JSON.stringify(state, null, 2), "utf-8");
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving user state:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to fetch the compiled single-file HTML for Google Apps Script
app.get("/api/gas-bundle", (req, res) => {
  const bundlePath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(bundlePath)) {
    const html = fs.readFileSync(bundlePath, "utf-8");
    res.json({ success: true, html, length: html.length });
  } else {
    res.status(404).json({ success: false, message: "Bundle not found. Run npm run build first." });
  }
});

// Download route for direct file download
app.get("/api/download-gas-html", (req, res) => {
  const bundlePath = path.join(process.cwd(), "dist", "index.html");
  if (fs.existsSync(bundlePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="Index.html"');
    res.setHeader("Content-Type", "text/html");
    res.sendFile(bundlePath);
  } else {
    res.status(404).send("Bundle not generated yet.");
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
