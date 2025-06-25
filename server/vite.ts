import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

// ✅ ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export async function setupVite(app: Express, server: Server) {
  // ✅ Await the resolved Vite config
  const resolvedConfig = await viteConfig();

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: {
        server, // ✅ for proper WebSocket HMR
      },
      allowedHosts: true,
    },
    appType: "custom",
  });

  // ✅ Use Vite's dev middleware
  app.use(vite.middlewares);

  // ✅ HTML rendering middleware
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const indexPath = path.resolve(__dirname, "..", "client", "index.html");

      let template = await fs.promises.readFile(indexPath, "utf-8");

      // ✅ Add version to bust cache
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public"); // ✅ corrected path

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `❌ Could not find the build directory: ${distPath}. Please run \`vite build\` first.`
    );
  }

  // ✅ Serve built static files
  app.use(express.static(distPath));

  // ✅ Fallback for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
