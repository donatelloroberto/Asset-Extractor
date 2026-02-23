import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { log } from "./logger";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export async function buildApp() {
  const app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).json = function (bodyJson: any, ...args: any[]) {
      capturedJsonResponse = bodyJson;
      return (originalResJson as any).apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api") || path.endsWith(".json") || path === "/health") {
        let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        log(line);
      }
    });

    next();
  });

  await registerRoutes(app);

  // Health check (useful for Vercel + uptime monitors)
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // eslint-disable-next-line no-console
    console.error("Internal Server Error:", err);

    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Static client in production (Vercel serves dist/ separately, but this keeps Node start working)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  return app;
}
