import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  const backendUrl = (process.env.BACKEND_API_URL || "https://banking-transaction-system-c5ba.onrender.com").replace(/\/$/, "");

  app.use(express.json());
  app.use("/api", async (req, res) => {
    const upstreamUrl = `${backendUrl}${req.originalUrl}`;
    const headers = new Headers();
    const forwardHeaders = ["authorization", "cookie", "content-type", "accept", "idempotency-key"];
    for (const name of forwardHeaders) {
      const value = req.get(name);
      if (value) headers.set(name, value);
    }

    try {
      const upstream = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      const contentType = upstream.headers.get("content-type");
      if (contentType) res.setHeader("content-type", contentType);
      const setCookies = upstream.headers.getSetCookie?.() || [];
      if (setCookies.length) res.setHeader("set-cookie", setCookies);
      res.status(upstream.status).send(body);
    } catch {
      res.status(502).json({ message: "Unable to connect to the banking service through the frontend proxy." });
    }
  });

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
