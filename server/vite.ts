import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url"; // ✅ ESM fix

const __filename = fileURLToPath(import.meta.url); // ✅ ESM fix
const __dirname = path.dirname(__filename);        // ✅ ESM fix

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// 🧪 Dev setup for local development with Vite middleware
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// 🧱 Production static serving from dist/public
export function serveStatic(app: Express) {
  const distPublicPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPublicPath)) {
    throw new Error(
      `❌ Could not find the build directory: ${distPublicPath}. Make sure to run 'npm run build' before deploying.`
    );
  }

  // Serve JS, CSS, images, etc.
  app.use(express.static(distPublicPath));

  // Fallback for React Router (SPA)
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPublicPath, "index.html"));
  });
}
