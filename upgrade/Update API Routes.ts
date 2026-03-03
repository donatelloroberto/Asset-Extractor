import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupStremioRoutes } from "./stremio/http";
import { handleM3u8Proxy } from "./proxy";

export function registerRoutes(app: Express): Server {
  // Setup Stremio routes
  setupStremioRoutes(app);

  // Mount the ISP Bypass edge proxy
  app.get('/api/proxy/m3u8', handleM3u8Proxy);

  const httpServer = createServer(app);
  return httpServer;
}