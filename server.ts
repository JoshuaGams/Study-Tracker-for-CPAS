import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

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
