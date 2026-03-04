import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { buildManifest } from "./stremio/manifest.js";
import { getCatalog, searchContent, getMeta, getStreams } from "./stremio/provider.js";
import { buildNurgayManifest } from "./nurgay/manifest.js";
import { getNurgayCatalog, searchNurgayContent, getNurgayMeta, getNurgayStreams } from "./nurgay/provider.js";
import { buildFxggxtManifest } from "./fxggxt/manifest.js";
import { getFxggxtCatalog, searchFxggxtContent, getFxggxtMeta, getFxggxtStreams } from "./fxggxt/provider.js";
import { buildJustthegaysManifest } from "./justthegays/manifest.js";
import { getJustthegaysCatalog, searchJustthegaysContent, getJustthegaysMeta, getJustthegaysStreams } from "./justthegays/provider.js";
import { buildBesthdgaypornManifest } from "./besthdgayporn/manifest.js";
import { getBesthdgaypornCatalog, searchBesthdgaypornContent, getBesthdgaypornMeta, getBesthdgaypornStreams } from "./besthdgayporn/provider.js";
import { buildBoyfriendtvManifest } from "./boyfriendtv/manifest.js";
import { getBoyfriendtvCatalog, searchBoyfriendtvContent, getBoyfriendtvMeta, getBoyfriendtvStreams } from "./boyfriendtv/provider.js";
import { buildGaycock4uManifest } from "./gaycock4u/manifest.js";
import { getGaycock4uCatalog, searchGaycock4uContent, getGaycock4uMeta, getGaycock4uStreams } from "./gaycock4u/provider.js";
import { buildGaystreamManifest } from "./gaystream/manifest.js";
import { getGaystreamCatalog, searchGaystreamContent, getGaystreamMeta, getGaystreamStreams } from "./gaystream/provider.js";
import { buildStashManifest, decodeStashConfig, type StashConfig } from "./stash/manifest.js";
import { getStashCatalog, searchStashContent, getStashMeta, getStashStreams } from "./stash/provider.js";
import { getCacheStats, clearAllCaches } from "./stremio/cache.js";
import { log } from "./logger.js";

const startTime = Date.now();


function getRequestBaseUrl(req: any): string {
  const protoHeader = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
  const hostHeader = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
  const protocol = protoHeader || req.protocol || "http";
  const host = hostHeader || req.get("host");
  return `${protocol}://${host}`;
}

function decodeBase64Param(value: string): string {
  try {
    return Buffer.from(value, "base64url").toString("utf-8");
  } catch {
    return Buffer.from(value, "base64").toString("utf-8");
  }
}

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    next();
  });

  app.options("/{*path}", (_req, res) => {
    res.status(204).end();
  });

  app.use((req, _res, next) => {
    const path = req.path;
    if (path.endsWith(".json") && !path.startsWith("/api/")) {
      _res.setHeader("Cache-Control", "public, max-age=7200, s-maxage=7200");
    }
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

  app.get("/stash/manifest.json", (_req, res) => {
    const manifest = buildStashManifest();
    res.json(manifest);
  });

  app.get("/stash/configure", (_req, res) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stash Stremio Add-on Configuration</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.container{max-width:480px;width:100%;background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333}
h1{font-size:24px;margin-bottom:8px;color:#fff}
p{color:#999;font-size:14px;margin-bottom:24px;line-height:1.5}
label{display:block;font-size:14px;font-weight:500;margin-bottom:6px;color:#ccc}
input{width:100%;padding:10px 14px;border:1px solid #444;border-radius:8px;background:#0a0a0a;color:#fff;font-size:14px;margin-bottom:16px;outline:none;transition:border-color .2s}
input:focus{border-color:#7c3aed}
input::placeholder{color:#666}
button{width:100%;padding:12px;border:none;border-radius:8px;background:#7c3aed;color:#fff;font-size:16px;font-weight:600;cursor:pointer;transition:background .2s}
button:hover{background:#6d28d9}
.help{font-size:12px;color:#777;margin-top:12px;line-height:1.5}
.manifest-result{margin-top:20px;padding:14px;background:#0a0a0a;border:1px solid #333;border-radius:8px;word-break:break-all;display:none}
.manifest-result code{font-size:12px;color:#a78bfa}
.manifest-result .actions{margin-top:12px;display:flex;gap:8px}
.manifest-result button{width:auto;padding:8px 16px;font-size:13px}
.btn-secondary{background:#333;color:#ccc}
.btn-secondary:hover{background:#444}
</style>
</head><body>
<div class="container">
<h1>Stash Add-on</h1>
<p>Connect your self-hosted Stash instance to Stremio. Enter your Stash server URL and API key below.</p>
<form id="form">
<label for="serverUrl">Stash Server URL</label>
<input type="url" id="serverUrl" placeholder="http://localhost:9999" required>
<label for="apiKey">API Key (optional if no auth)</label>
<input type="text" id="apiKey" placeholder="Your Stash API key">
<button type="submit">Generate Manifest URL</button>
</form>
<div class="manifest-result" id="result">
<label>Your manifest URL:</label>
<code id="manifestUrl"></code>
<div class="actions">
<button onclick="installStremio()" id="installBtn">Install in Stremio</button>
<button class="btn-secondary" onclick="copyUrl()">Copy URL</button>
</div>
</div>
<p class="help">You can find your API key in Stash Settings &gt; Security &gt; API Key. If your Stash instance has no authentication enabled, leave the API key field empty.</p>
</div>
<script>
let manifestUrl='';
document.getElementById('form').onsubmit=function(e){
e.preventDefault();
const serverUrl=document.getElementById('serverUrl').value.replace(/\\/+$/,'');
const apiKey=document.getElementById('apiKey').value.trim();
const config=btoa(JSON.stringify({serverUrl,apiKey})).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
const base=window.location.origin;
manifestUrl=base+'/stash/'+config+'/manifest.json';
document.getElementById('manifestUrl').textContent=manifestUrl;
document.getElementById('result').style.display='block';
};
function installStremio(){
const url=manifestUrl.replace(/^https?:\\/\\//,'');
window.open('stremio://'+url,'_blank');
}
function copyUrl(){navigator.clipboard.writeText(manifestUrl);alert('Copied!');}
</script>
</body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  app.get("/stash/:config/manifest.json", (req, res) => {
    try {
      const config = decodeStashConfig(req.params.config);
      const manifest = buildStashManifest(config);
      res.json(manifest);
    } catch (err: any) {
      log(`Stash manifest error: ${err.message}`, "stash");
      res.status(400).json({ error: "Invalid Stash configuration. Visit /stash/configure to set up." });
    }
  });

  app.get("/stash/:config/catalog/:type/:id.json", async (req, res) => {
    try {
      const config = decodeStashConfig(req.params.config);
      const { id } = req.params;
      const skip = parseInt((req.query as any).skip || "0", 10);
      const search = (req.query as any).search as string | undefined;
      log(`Stash catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stash");
      let metas;
      if (id === "stash-search" && search) {
        metas = await searchStashContent(config, search, skip);
      } else {
        metas = await getStashCatalog(config, id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`Stash catalog error: ${err.message}`, "stash");
      res.json({ metas: [] });
    }
  });

  app.get("/stash/:config/catalog/:type/:id/:extra.json", async (req, res) => {
    try {
      const config = decodeStashConfig(req.params.config);
      const { id, extra } = req.params;
      const extraPairs = parseStremioExtra(extra);
      const skip = parseInt(extraPairs.skip || "0", 10);
      const search = extraPairs.search || undefined;
      log(`Stash catalog request: ${id}, skip=${skip}, search=${search || "none"}`, "stash");
      let metas;
      if (id === "stash-search" && search) {
        metas = await searchStashContent(config, search, skip);
      } else {
        metas = await getStashCatalog(config, id, skip);
      }
      res.json({ metas });
    } catch (err: any) {
      log(`Stash catalog error: ${err.message}`, "stash");
      res.json({ metas: [] });
    }
  });

  app.get("/stash/:config/meta/:type/:id.json", async (req, res) => {
    try {
      const config = decodeStashConfig(req.params.config);
      const { id } = req.params;
      log(`Stash meta request: ${id}`, "stash");
      const meta = await getStashMeta(config, id);
      if (!meta) return res.json({ meta: null });
      res.json({ meta });
    } catch (err: any) {
      log(`Stash meta error: ${err.message}`, "stash");
      res.json({ meta: null });
    }
  });

  app.get("/stash/:config/stream/:type/:id.json", async (req, res) => {
    try {
      const config = decodeStashConfig(req.params.config);
      const { id } = req.params;
      log(`Stash stream request: ${id}`, "stash");
      const streams = await getStashStreams(config, id);
      res.json({ streams });
    } catch (err: any) {
      log(`Stash stream error: ${err.message}`, "stash");
      res.json({ streams: [] });
    }
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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
      const baseUrl = getRequestBaseUrl(req);
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

      const baseUrl = getRequestBaseUrl(req);
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
        streams = await getStreams(id, baseUrl);
      }

      res.json({ streams });
    } catch (err: any) {
      log(`Stream error: ${err.message}`, "stremio");
      res.json({ streams: [] });
    }
  });


  app.get("/api/proxy/m3u8", async (req, res) => {
    try {
      const encodedUrl = req.query.url as string;
      const encodedRef = req.query.ref as string | undefined;

      if (!encodedUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      const streamUrl = decodeBase64Param(encodedUrl);
      const referer = encodedRef
        ? decodeBase64Param(encodedRef)
        : new URL(streamUrl).origin;

      const response = await axios.get<string>(streamUrl, {
        headers: {
          Referer: referer,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, text/plain, */*",
        },
        responseType: "text",
        timeout: 15000,
        maxRedirects: 5,
      });

      const base = new URL(streamUrl);
      const rewritten = response.data
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return line;

          const absolute = new URL(trimmed, base).toString();
          if (absolute.toLowerCase().includes(".m3u8")) {
            const nestedUrl = Buffer.from(absolute).toString("base64url");
            const nestedRef = Buffer.from(referer).toString("base64url");
            return `${getRequestBaseUrl(req)}/api/proxy/m3u8?url=${nestedUrl}&ref=${nestedRef}`;
          }

          return absolute;
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=120");
      return res.status(200).send(rewritten);
    } catch (err: any) {
      log(`M3U8 proxy error: ${err.message}`, "stremio");
      return res.status(502).json({ error: "Failed to proxy m3u8" });
    }
  });
  app.get("/proxy/stream", async (req, res) => {
    try {
      const streamUrl = req.query.url as string;
      const referer = req.query.referer as string || "";

      if (!streamUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      log(`Proxy stream: ${streamUrl}`, "stremio");

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

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

  app.get("/api/player", (req, res) => {
    try {
      const encodedUrl = req.query.url as string;
      const name = req.query.name as string || "Video Player";

      if (!encodedUrl) {
        return res.status(400).send("Missing url parameter");
      }

      const embedUrl = decodeBase64Param(encodedUrl);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#000;overflow:hidden}
.player-container{position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000}
iframe{width:100%;height:100%;border:none}
.loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-family:system-ui,sans-serif;font-size:18px;z-index:10}
.loading.hidden{display:none}
</style>
</head>
<body>
<div class="player-container">
<div class="loading" id="loading">Loading player...</div>
<iframe id="player"
  src="${embedUrl}"
  allow="autoplay;fullscreen;encrypted-media;picture-in-picture"
  allowfullscreen
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
  onload="document.getElementById('loading').classList.add('hidden')"
></iframe>
</div>
<script>
document.addEventListener('keydown',function(e){if(e.key==='Escape'||e.key==='q'){window.close();}});
try{if(window.opener||window.parent!==window){}}catch(e){}
</script>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      return res.status(200).send(html);
    } catch (err: any) {
      log(`Player error: ${err.message}`, "stremio");
      return res.status(500).send("Player error");
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
      { manifest: buildStashManifest(), path: "/stash/manifest.json" },
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
      stash: buildStashManifest().catalogs,
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

  return httpServer;
}
