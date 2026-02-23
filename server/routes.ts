import type { Express } from "express";
import axios from "axios";
import { buildManifest } from "./stremio/manifest";
import { getCatalog, searchContent, getMeta, getStreams } from "./stremio/provider";
import { buildNurgayManifest } from "./nurgay/manifest";
import { getNurgayCatalog, searchNurgayContent, getNurgayMeta, getNurgayStreams } from "./nurgay/provider";
import { buildFxggxtManifest } from "./fxggxt/manifest";
import { getFxggxtCatalog, searchFxggxtContent, getFxggxtMeta, getFxggxtStreams } from "./fxggxt/provider";
import { buildJustthegaysManifest } from "./justthegays/manifest";
import { getJustthegaysCatalog, searchJustthegaysContent, getJustthegaysMeta, getJustthegaysStreams } from "./justthegays/provider";
import { buildBesthdgaypornManifest } from "./besthdgayporn/manifest";
import { getBesthdgaypornCatalog, searchBesthdgaypornContent, getBesthdgaypornMeta, getBesthdgaypornStreams } from "./besthdgayporn/provider";
import { buildBoyfriendtvManifest } from "./boyfriendtv/manifest";
import { getBoyfriendtvCatalog, searchBoyfriendtvContent, getBoyfriendtvMeta, getBoyfriendtvStreams } from "./boyfriendtv/provider";
import { buildGaycock4uManifest } from "./gaycock4u/manifest";
import { getGaycock4uCatalog, searchGaycock4uContent, getGaycock4uMeta, getGaycock4uStreams } from "./gaycock4u/provider";
import { buildGaystreamManifest } from "./gaystream/manifest";
import { getGaystreamCatalog, searchGaystreamContent, getGaystreamMeta, getGaystreamStreams } from "./gaystream/provider";
import { getCacheStats, clearAllCaches } from "./stremio/cache";
import { log } from "./logger";

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

function isNurgayId(id: string): boolean {
  return id.startsWith("nurgay:");
}

function isFxggxtId(id: string): boolean {
  return id.startsWith("fxggxt:");
}

function isNurgayCatalog(id: string): boolean {
  return id.startsWith("nurgay-");
}

function isFxggxtCatalog(id: string): boolean {
  return id.startsWith("fxggxt-");
}

function isJustthegaysId(id: string): boolean {
  return id.startsWith("justthegays:");
}

function isJustthegaysCatalog(id: string): boolean {
  return id.startsWith("justthegays-");
}

function isBesthdgaypornId(id: string): boolean {
  return id.startsWith("besthdgayporn:");
}

function isBesthdgaypornCatalog(id: string): boolean {
  return id.startsWith("besthdgayporn-");
}

function isBoyfriendtvId(id: string): boolean {
  return id.startsWith("boyfriendtv:");
}

function isBoyfriendtvCatalog(id: string): boolean {
  return id.startsWith("boyfriendtv-");
}

function isGaycock4uId(id: string): boolean {
  return id.startsWith("gaycock4u:");
}

function isGaycock4uCatalog(id: string): boolean {
  return id.startsWith("gaycock4u-");
}

function isGaystreamId(id: string): boolean {
  return id.startsWith("gaystream:");
}

function isGaystreamCatalog(id: string): boolean {
  return id.startsWith("gaystream-");
}

export async function registerRoutes(app: Express): Promise<void> {
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

  app.get("/nurgay/manifest.json", (_req, res) => {
    const manifest = buildNurgayManifest();
    res.json(manifest);
  });

  app.get("/fxggxt/manifest.json", (_req, res) => {
    const manifest = buildFxggxtManifest();
    res.json(manifest);
  });

  app.get("/justthegays/manifest.json", (_req, res) => {
    const manifest = buildJustthegaysManifest();
    res.json(manifest);
  });

  app.get("/besthdgayporn/manifest.json", (_req, res) => {
    const manifest = buildBesthdgaypornManifest();
    res.json(manifest);
  });

  app.get("/boyfriendtv/manifest.json", (_req, res) => {
    const manifest = buildBoyfriendtvManifest();
    res.json(manifest);
  });

  app.get("/gaycock4u/manifest.json", (_req, res) => {
    const manifest = buildGaycock4uManifest();
    res.json(manifest);
  });

  app.get("/gaystream/manifest.json", (_req, res) => {
    const manifest = buildGaystreamManifest();
    res.json(manifest);
  });

  // BestHDgayporn dedicated routes
  app.get("/besthdgayporn/catalog/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;
      log(`BestHDgayporn catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "besthdgayporn-search" && search) {
        metas = await searchBesthdgaypornContent(search, skip);
      } else {
        metas = await getBesthdgaypornCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`BestHDgayporn catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/besthdgayporn/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;
      log(`BestHDgayporn catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "besthdgayporn-search" && search) {
        metas = await searchBesthdgaypornContent(search, skip);
      } else {
        metas = await getBesthdgaypornCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`BestHDgayporn catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/besthdgayporn/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`BestHDgayporn meta request: ${id}`, "stremio");
      const meta = await getBesthdgaypornMeta(id);
      if (!meta) return res.json({ meta: null });
      res.json({ meta });
    } catch (err: any) {
      log(`BestHDgayporn meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/besthdgayporn/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`BestHDgayporn stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getBesthdgaypornStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`BestHDgayporn stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  // BoyfriendTV dedicated routes
  app.get("/boyfriendtv/catalog/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;
      log(`BoyfriendTV catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "boyfriendtv-search" && search) {
        metas = await searchBoyfriendtvContent(search, skip);
      } else {
        metas = await getBoyfriendtvCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`BoyfriendTV catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/boyfriendtv/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;
      log(`BoyfriendTV catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "boyfriendtv-search" && search) {
        metas = await searchBoyfriendtvContent(search, skip);
      } else {
        metas = await getBoyfriendtvCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`BoyfriendTV catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/boyfriendtv/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`BoyfriendTV meta request: ${id}`, "stremio");
      const meta = await getBoyfriendtvMeta(id);
      if (!meta) return res.json({ meta: null });
      res.json({ meta });
    } catch (err: any) {
      log(`BoyfriendTV meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/boyfriendtv/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`BoyfriendTV stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getBoyfriendtvStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`BoyfriendTV stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  // Gaycock4U dedicated routes
  app.get("/gaycock4u/catalog/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;
      log(`Gaycock4U catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "gaycock4u-search" && search) {
        metas = await searchGaycock4uContent(search, skip);
      } else {
        metas = await getGaycock4uCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`Gaycock4U catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/gaycock4u/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;
      log(`Gaycock4U catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "gaycock4u-search" && search) {
        metas = await searchGaycock4uContent(search, skip);
      } else {
        metas = await getGaycock4uCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`Gaycock4U catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/gaycock4u/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Gaycock4U meta request: ${id}`, "stremio");
      const meta = await getGaycock4uMeta(id);
      if (!meta) return res.json({ meta: null });
      res.json({ meta });
    } catch (err: any) {
      log(`Gaycock4U meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/gaycock4u/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Gaycock4U stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getGaycock4uStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`Gaycock4U stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  // GayStream dedicated routes
  app.get("/gaystream/catalog/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;
      log(`GayStream catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "gaystream-search" && search) {
        metas = await searchGaystreamContent(search, skip);
      } else {
        metas = await getGaystreamCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`GayStream catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/gaystream/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;
      log(`GayStream catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");
      let metas;
      if (id === "gaystream-search" && search) {
        metas = await searchGaystreamContent(search, skip);
      } else {
        metas = await getGaystreamCatalog(id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`GayStream catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/gaystream/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`GayStream meta request: ${id}`, "stremio");
      const meta = await getGaystreamMeta(id);
      if (!meta) return res.json({ meta: null });
      res.json({ meta });
    } catch (err: any) {
      log(`GayStream meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/gaystream/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`GayStream stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getGaystreamStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`GayStream stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/justthegays/catalog/:type/:id.json", async (req, res) => {
    try {
      const { type, id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      log(`Justthegays catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "justthegays-search" && search) {
        metas = await searchJustthegaysContent(search, skip);
      } else {
        metas = await getJustthegaysCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Justthegays catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/justthegays/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { type, id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;

      log(`Justthegays catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "justthegays-search" && search) {
        metas = await searchJustthegaysContent(search, skip);
      } else {
        metas = await getJustthegaysCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Justthegays catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/justthegays/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Justthegays meta request: ${id}`, "stremio");
      const meta = await getJustthegaysMeta(id);
      if (!meta) {
        return res.json({ meta: null });
      }
      res.json({ meta });
    } catch (err: any) {
      log(`Justthegays meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/justthegays/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Justthegays stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getJustthegaysStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`Justthegays stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/fxggxt/catalog/:type/:id.json", async (req, res) => {
    try {
      const { type, id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      log(`Fxggxt catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "fxggxt-search" && search) {
        metas = await searchFxggxtContent(search, skip);
      } else {
        metas = await getFxggxtCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Fxggxt catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/fxggxt/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { type, id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;

      log(`Fxggxt catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "fxggxt-search" && search) {
        metas = await searchFxggxtContent(search, skip);
      } else {
        metas = await getFxggxtCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Fxggxt catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/fxggxt/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Fxggxt meta request: ${id}`, "stremio");
      const meta = await getFxggxtMeta(id);
      if (!meta) {
        return res.json({ meta: null });
      }
      res.json({ meta });
    } catch (err: any) {
      log(`Fxggxt meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/fxggxt/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Fxggxt stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getFxggxtStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`Fxggxt stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/nurgay/catalog/:type/:id.json", async (req, res) => {
    try {
      const { type, id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      log(`Nurgay catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "nurgay-search" && search) {
        metas = await searchNurgayContent(search, skip);
      } else {
        metas = await getNurgayCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Nurgay catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/nurgay/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const { type, id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;

      log(`Nurgay catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "nurgay-search" && search) {
        metas = await searchNurgayContent(search, skip);
      } else {
        metas = await getNurgayCatalog(id, skip);
      }

      res.json({ metas });
    } catch (err: any) {
      log(`Nurgay catalog error: ${err.message}`, "stremio");
      res.json({ metas: [] });
    }
  });

  app.get("/nurgay/meta/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Nurgay meta request: ${id}`, "stremio");
      const meta = await getNurgayMeta(id);
      if (!meta) {
        return res.json({ meta: null });
      }
      res.json({ meta });
    } catch (err: any) {
      log(`Nurgay meta error: ${err.message}`, "stremio");
      res.json({ meta: null });
    }
  });

  app.get("/nurgay/stream/:type/:id.json", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Nurgay stream request: ${id}`, "stremio");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const streams = await getNurgayStreams(id, baseUrl);
      res.json({ streams });
    } catch (err: any) {
      log(`Nurgay stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/catalog/:type/:id.json", async (req, res) => {
    try {
      const { type, id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      log(`Catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stremio");

      let metas;
      if (id === "nurgay-search" && search) {
        metas = await searchNurgayContent(search, skip);
      } else if (isNurgayCatalog(id)) {
        metas = await getNurgayCatalog(id, skip);
      } else if (id === "fxggxt-search" && search) {
        metas = await searchFxggxtContent(search, skip);
      } else if (isFxggxtCatalog(id)) {
        metas = await getFxggxtCatalog(id, skip);
      } else if (id === "justthegays-search" && search) {
        metas = await searchJustthegaysContent(search, skip);
      } else if (isJustthegaysCatalog(id)) {
        metas = await getJustthegaysCatalog(id, skip);
      } else if (id === "besthdgayporn-search" && search) {
        metas = await searchBesthdgaypornContent(search, skip);
      } else if (isBesthdgaypornCatalog(id)) {
        metas = await getBesthdgaypornCatalog(id, skip);
      } else if (id === "boyfriendtv-search" && search) {
        metas = await searchBoyfriendtvContent(search, skip);
      } else if (isBoyfriendtvCatalog(id)) {
        metas = await getBoyfriendtvCatalog(id, skip);
      } else if (id === "gaycock4u-search" && search) {
        metas = await searchGaycock4uContent(search, skip);
      } else if (isGaycock4uCatalog(id)) {
        metas = await getGaycock4uCatalog(id, skip);
      } else if (id === "gaystream-search" && search) {
        metas = await searchGaystreamContent(search, skip);
      } else if (isGaystreamCatalog(id)) {
        metas = await getGaystreamCatalog(id, skip);
      } else if (id === "gxtapes-search" && search) {
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
      if (id === "nurgay-search" && search) {
        metas = await searchNurgayContent(search, skip);
      } else if (isNurgayCatalog(id)) {
        metas = await getNurgayCatalog(id, skip);
      } else if (id === "fxggxt-search" && search) {
        metas = await searchFxggxtContent(search, skip);
      } else if (isFxggxtCatalog(id)) {
        metas = await getFxggxtCatalog(id, skip);
      } else if (id === "justthegays-search" && search) {
        metas = await searchJustthegaysContent(search, skip);
      } else if (isJustthegaysCatalog(id)) {
        metas = await getJustthegaysCatalog(id, skip);
      } else if (id === "besthdgayporn-search" && search) {
        metas = await searchBesthdgaypornContent(search, skip);
      } else if (isBesthdgaypornCatalog(id)) {
        metas = await getBesthdgaypornCatalog(id, skip);
      } else if (id === "boyfriendtv-search" && search) {
        metas = await searchBoyfriendtvContent(search, skip);
      } else if (isBoyfriendtvCatalog(id)) {
        metas = await getBoyfriendtvCatalog(id, skip);
      } else if (id === "gaycock4u-search" && search) {
        metas = await searchGaycock4uContent(search, skip);
      } else if (isGaycock4uCatalog(id)) {
        metas = await getGaycock4uCatalog(id, skip);
      } else if (id === "gaystream-search" && search) {
        metas = await searchGaystreamContent(search, skip);
      } else if (isGaystreamCatalog(id)) {
        metas = await getGaystreamCatalog(id, skip);
      } else if (id === "gxtapes-search" && search) {
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

      let meta;
      if (isNurgayId(id)) {
        meta = await getNurgayMeta(id);
      } else if (isFxggxtId(id)) {
        meta = await getFxggxtMeta(id);
      } else if (isJustthegaysId(id)) {
        meta = await getJustthegaysMeta(id);
      } else if (isBesthdgaypornId(id)) {
        meta = await getBesthdgaypornMeta(id);
      } else if (isBoyfriendtvId(id)) {
        meta = await getBoyfriendtvMeta(id);
      } else if (isGaycock4uId(id)) {
        meta = await getGaycock4uMeta(id);
      } else if (isGaystreamId(id)) {
        meta = await getGaystreamMeta(id);
      } else {
        meta = await getMeta(id);
      }

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

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      let streams;
      if (isNurgayId(id)) {
        streams = await getNurgayStreams(id, baseUrl);
      } else if (isFxggxtId(id)) {
        streams = await getFxggxtStreams(id, baseUrl);
      } else if (isJustthegaysId(id)) {
        streams = await getJustthegaysStreams(id, baseUrl);
      } else if (isBesthdgaypornId(id)) {
        streams = await getBesthdgaypornStreams(id, baseUrl);
      } else if (isBoyfriendtvId(id)) {
        streams = await getBoyfriendtvStreams(id, baseUrl);
      } else if (isGaycock4uId(id)) {
        streams = await getGaycock4uStreams(id, baseUrl);
      } else if (isGaystreamId(id)) {
        streams = await getGaystreamStreams(id, baseUrl);
      } else {
        streams = await getStreams(id);
      }

      res.json({ streams });
    } catch (err: any) {
      log(`Stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });

  app.get("/proxy/stream", async (req, res) => {
    try {
      const streamUrl = req.query.url as string;
      const referer = req.query.referer as string || "";

      // FIX: Added SSRF (Server-Side Request Forgery) protection
      // Validates that a URL is provided, has a valid HTTP/HTTPS protocol, 
      // and isn't pointing to a local/internal network address.
      if (!streamUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(streamUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return res.status(400).json({ error: "Invalid protocol. Only HTTP/HTTPS allowed." });
        }
        
        // Block requests to localhost or local IPs to protect your server
        const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        if (forbiddenHosts.includes(parsedUrl.hostname)) {
          return res.status(403).json({ error: "Forbidden network target" });
        }
      } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      log(`Proxy stream: ${streamUrl}`, "stremio");

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      };
      if (referer) {
        headers["Referer"] = referer;
      }

      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        headers["Range"] = rangeHeader;
      }

      const response = await axios.get(streamUrl, {
        headers,
        responseType: "stream",
        timeout: 30000,
        maxRedirects: 5,
      });

      res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }
      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", response.headers["content-range"]);
      }
      if (response.headers["accept-ranges"]) {
        res.setHeader("Accept-Ranges", response.headers["accept-ranges"]);
      }
      res.status(response.status);

      response.data.pipe(res);

      response.data.on("error", (err: any) => {
        log(`Proxy stream pipe error: ${err.message}`, "stremio");
        if (!res.headersSent) {
          res.status(502).json({ error: "Stream error" });
        }
      });
    } catch (err: any) {
      log(`Proxy stream error: ${err.message}`, "stremio");
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to proxy stream" });
      }
    }
  });

  app.get("/api/status", (_req, res) => {
    const allManifests = [
      { manifest: buildManifest(), path: "/manifest.json" },
      { manifest: buildNurgayManifest(), path: "/nurgay/manifest.json" },
      { manifest: buildFxggxtManifest(), path: "/fxggxt/manifest.json" },
      { manifest: buildJustthegaysManifest(), path: "/justthegays/manifest.json" },
      { manifest: buildBesthdgaypornManifest(), path: "/besthdgayporn/manifest.json" },
      { manifest: buildBoyfriendtvManifest(), path: "/boyfriendtv/manifest.json" },
      { manifest: buildGaycock4uManifest(), path: "/gaycock4u/manifest.json" },
      { manifest: buildGaystreamManifest(), path: "/gaystream/manifest.json" },
    ];
    const cacheStats = getCacheStats();
    const totalCatalogs = allManifests.reduce((sum, m) => sum + m.manifest.catalogs.length, 0);
    res.json({
      name: "Stremio Add-ons",
      version: "1.0.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      catalogs: totalCatalogs,
      cacheStats,
      addons: allManifests.map(({ manifest, path }) => ({
        name: manifest.name,
        version: manifest.version,
        catalogs: manifest.catalogs.length,
        manifestPath: path,
      })),
      endpoints: allManifests.map(({ manifest, path }) => ({
        path,
        description: `${manifest.name} manifest`,
      })).concat([
        { path: "/catalog/movie/{catalogId}.json", description: "Browse catalogs" },
        { path: "/meta/movie/{id}.json", description: "Content metadata" },
        { path: "/stream/movie/{id}.json", description: "Stream links" },
      ]),
    });
  });

  app.get("/api/catalogs", (_req, res) => {
    res.json({
      gxtapes: buildManifest().catalogs,
      nurgay: buildNurgayManifest().catalogs,
      fxggxt: buildFxggxtManifest().catalogs,
      justthegays: buildJustthegaysManifest().catalogs,
      besthdgayporn: buildBesthdgaypornManifest().catalogs,
      boyfriendtv: buildBoyfriendtvManifest().catalogs,
      gaycock4u: buildGaycock4uManifest().catalogs,
      gaystream: buildGaystreamManifest().catalogs,
    });
  });

  app.get("/api/catalog/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;

      let items;
      if (id === "nurgay-search" && search) {
        items = await searchNurgayContent(search, skip);
      } else if (isNurgayCatalog(id)) {
        items = await getNurgayCatalog(id, skip);
      } else if (id === "fxggxt-search" && search) {
        items = await searchFxggxtContent(search, skip);
      } else if (isFxggxtCatalog(id)) {
        items = await getFxggxtCatalog(id, skip);
      } else if (id === "justthegays-search" && search) {
        items = await searchJustthegaysContent(search, skip);
      } else if (isJustthegaysCatalog(id)) {
        items = await getJustthegaysCatalog(id, skip);
      } else if (id === "besthdgayporn-search" && search) {
        items = await searchBesthdgaypornContent(search, skip);
      } else if (isBesthdgaypornCatalog(id)) {
        items = await getBesthdgaypornCatalog(id, skip);
      } else if (id === "boyfriendtv-search" && search) {
        items = await searchBoyfriendtvContent(search, skip);
      } else if (isBoyfriendtvCatalog(id)) {
        items = await getBoyfriendtvCatalog(id, skip);
      } else if (id === "gaycock4u-search" && search) {
        items = await searchGaycock4uContent(search, skip);
      } else if (isGaycock4uCatalog(id)) {
        items = await getGaycock4uCatalog(id, skip);
      } else if (id === "gaystream-search" && search) {
        items = await searchGaystreamContent(search, skip);
      } else if (isGaystreamCatalog(id)) {
        items = await getGaystreamCatalog(id, skip);
      } else if (id === "gxtapes-search" && search) {
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
      let meta;
      if (isNurgayId(id)) {
        meta = await getNurgayMeta(id);
      } else if (isFxggxtId(id)) {
        meta = await getFxggxtMeta(id);
      } else if (isJustthegaysId(id)) {
        meta = await getJustthegaysMeta(id);
      } else if (isBesthdgaypornId(id)) {
        meta = await getBesthdgaypornMeta(id);
      } else if (isBoyfriendtvId(id)) {
        meta = await getBoyfriendtvMeta(id);
      } else if (isGaycock4uId(id)) {
        meta = await getGaycock4uMeta(id);
      } else if (isGaystreamId(id)) {
        meta = await getGaystreamMeta(id);
      } else {
        meta = await getMeta(id);
      }
      res.json(meta);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/cache/clear", (_req, res) => {
    clearAllCaches();
    res.json({ success: true });
  });

  return;
}
