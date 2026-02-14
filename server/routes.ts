import type { Express } from "express";
import { createServer, type Server } from "http";
import { buildManifest } from "./stremio/manifest";
import { getCatalog, searchContent, getMeta, getStreams } from "./stremio/provider";
import { getCacheStats, clearAllCaches } from "./stremio/cache";
import { log } from "./index";

const startTime = Date.now();

function parseStremioExtra(extra: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = extra.split("&");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) {
      const key = decodeURIComponent(part.slice(0, eqIdx));
      const value = decodeURIComponent(part.slice(eqIdx + 1));
      result[key] = value;
    }
  }
  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    next();
  });

  app.get("/manifest.json", (_req, res) => {
    const manifest = buildManifest();
    res.json(manifest);
  });

  app.get("/catalog/:type/:id.json", async (req, res) => {
    try {
      const { type, id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      log(`Catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "gxtapes-search" && search) {
        metas = await searchContent(search, skip);
      } else {
        metas = await getCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { type, id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;

      log(`Catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "gxtapes-search" && search) {
        metas = await searchContent(search, skip);
      } else {
        metas = await getCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Meta request: ${id}`, "stremio");
      const meta = await getMeta(id);
      if (!meta) {
        return res.json({ meta: null });
      }
      res.json({ meta });
    } catch (err: any) {
      log(`Meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Stream request: ${id}`, "stremio");
      const streams = await getStreams(id);
      res.json({ streams });
    } catch (err: any) {
      log(`Stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/api/status", (_req, res) => {
    const manifest = buildManifest();
    const cacheStats = getCacheStats();
    res.json({
      name: manifest.name,
      version: manifest.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      catalogs: manifest.catalogs.length,
      cacheStats,
      endpoints: [
        { path: "/manifest.json", description: "Stremio manifest" },
        { path: "/catalog/movie/{catalogId}.json", description: "Browse catalogs" },
        { path: "/meta/movie/{id}.json", description: "Content metadata" },
        { path: "/stream/movie/{id}.json", description: "Stream links" },
      ],
    });
  });

  app.get("/api/catalogs", (_req, res) => {
    const manifest = buildManifest();
    res.json(manifest.catalogs);
  });

  app.get("/api/catalog/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      let items;
      if (id === "gxtapes-search" && search) {
        items = await searchContent(search, skip);
      } else {
        items = await getCatalog(id, skip);
      }
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/meta/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const meta = await getMeta(id);
      res.json(meta);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cache/clear", (_req, res) => {
    clearAllCaches();
    res.json({ success: true });
  });

  return httpServer;
}
