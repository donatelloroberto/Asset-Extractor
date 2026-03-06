import type { Express, Request, Response } from "express";
import archiver from "archiver";
import { log } from "../logger.js";

import { CATALOG_MAP } from "../stremio/manifest.js";
import { getCatalog, getMeta, getStreams } from "../stremio/provider.js";
import { NURGAY_CATALOG_MAP } from "../nurgay/manifest.js";
import { getNurgayCatalog, getNurgayMeta, getNurgayStreams } from "../nurgay/provider.js";
import { FXGGXT_CATALOG_MAP } from "../fxggxt/manifest.js";
import { getFxggxtCatalog, getFxggxtMeta, getFxggxtStreams } from "../fxggxt/provider.js";
import { JUSTTHEGAYS_CATALOG_MAP } from "../justthegays/manifest.js";
import { getJustthegaysCatalog, getJustthegaysMeta, getJustthegaysStreams } from "../justthegays/provider.js";
import { BESTHDGAYPORN_CATALOG_MAP } from "../besthdgayporn/manifest.js";
import { getBesthdgaypornCatalog, getBesthdgaypornMeta, getBesthdgaypornStreams } from "../besthdgayporn/provider.js";
import { BOYFRIENDTV_CATALOG_MAP } from "../boyfriendtv/manifest.js";
import { getBoyfriendtvCatalog, getBoyfriendtvMeta, getBoyfriendtvStreams } from "../boyfriendtv/provider.js";
import { GAYCOCK4U_CATALOG_MAP } from "../gaycock4u/manifest.js";
import { getGaycock4uCatalog, getGaycock4uMeta, getGaycock4uStreams } from "../gaycock4u/provider.js";
import { GAYSTREAM_CATALOG_MAP } from "../gaystream/manifest.js";
import { getGaystreamCatalog, getGaystreamMeta, getGaystreamStreams } from "../gaystream/provider.js";

import type { CatalogItem, StremioStream, StremioMeta } from "../../shared/schema.js";

interface AddonProvider {
  name: string;
  prefix: string;
  catalogMap: Record<string, { path: string; name: string; isQuery?: boolean }>;
  getCatalog: (catalogId: string, skip?: number) => Promise<CatalogItem[]>;
  getMeta: (id: string) => Promise<StremioMeta | null>;
  getStreams: (id: string, baseUrl?: string) => Promise<StremioStream[]>;
}

const ADDON_REGISTRY: Record<string, AddonProvider> = {
  gxtapes: {
    name: "GXtapes",
    prefix: "gxtapes:",
    catalogMap: CATALOG_MAP,
    getCatalog,
    getMeta,
    getStreams,
  },
  nurgay: {
    name: "Nurgay",
    prefix: "nurgay:",
    catalogMap: NURGAY_CATALOG_MAP,
    getCatalog: getNurgayCatalog,
    getMeta: getNurgayMeta,
    getStreams: getNurgayStreams,
  },
  fxggxt: {
    name: "Fxggxt",
    prefix: "fxggxt:",
    catalogMap: FXGGXT_CATALOG_MAP,
    getCatalog: getFxggxtCatalog,
    getMeta: getFxggxtMeta,
    getStreams: getFxggxtStreams,
  },
  justthegays: {
    name: "JustTheGays",
    prefix: "justthegays:",
    catalogMap: JUSTTHEGAYS_CATALOG_MAP,
    getCatalog: getJustthegaysCatalog,
    getMeta: getJustthegaysMeta,
    getStreams: getJustthegaysStreams,
  },
  besthdgayporn: {
    name: "BestHDgayporn",
    prefix: "besthdgayporn:",
    catalogMap: BESTHDGAYPORN_CATALOG_MAP,
    getCatalog: getBesthdgaypornCatalog,
    getMeta: getBesthdgaypornMeta,
    getStreams: getBesthdgaypornStreams,
  },
  boyfriendtv: {
    name: "BoyfriendTV",
    prefix: "boyfriendtv:",
    catalogMap: BOYFRIENDTV_CATALOG_MAP,
    getCatalog: getBoyfriendtvCatalog,
    getMeta: getBoyfriendtvMeta,
    getStreams: getBoyfriendtvStreams,
  },
  gaycock4u: {
    name: "Gaycock4U",
    prefix: "gaycock4u:",
    catalogMap: GAYCOCK4U_CATALOG_MAP,
    getCatalog: getGaycock4uCatalog,
    getMeta: getGaycock4uMeta,
    getStreams: getGaycock4uStreams,
  },
  gaystream: {
    name: "GayStream",
    prefix: "gaystream:",
    catalogMap: GAYSTREAM_CATALOG_MAP,
    getCatalog: getGaystreamCatalog,
    getMeta: getGaystreamMeta,
    getStreams: getGaystreamStreams,
  },
};

function getRequestBaseUrl(req: Request): string {
  const protoHeader = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
  const hostHeader = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
  const protocol = protoHeader || req.protocol || "http";
  const host = hostHeader || req.get("host");
  return `${protocol}://${host}`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 200) || "Untitled";
}

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateNfo(title: string, poster?: string, description?: string): string {
  let nfo = `<?xml version="1.0" encoding="UTF-8"?>\n<movie>\n`;
  nfo += `  <title>${escXml(title)}</title>\n`;
  if (description) nfo += `  <plot>${escXml(description)}</plot>\n`;
  if (poster) nfo += `  <thumb aspect="poster">${escXml(poster)}</thumb>\n`;
  nfo += `</movie>\n`;
  return nfo;
}

function streamScore(s: StremioStream): number {
  if (!s.url) return 0;
  if (s.url.includes("/api/player")) return 0;
  const isProxy = s.url.includes("/proxy/stream") || s.url.includes("/api/proxy/m3u8");
  const isWebReady = !s.behaviorHints?.notWebReady;
  if (isWebReady && !isProxy) return 4;
  if (!isWebReady && !isProxy) return 3;
  if (isWebReady && isProxy) return 2;
  return 1;
}

function selectBestStream(streams: StremioStream[]): StremioStream | null {
  const playable = streams
    .filter((s) => s.url && !s.url.includes("/api/player"))
    .sort((a, b) => streamScore(b) - streamScore(a));
  return playable.length > 0 ? playable[0] : null;
}

export function registerPlexRoutes(app: Express) {
  app.get("/plex/configure", (req: Request, res: Response) => {
    const baseUrl = getRequestBaseUrl(req);
    const addonList = Object.entries(ADDON_REGISTRY)
      .map(
        ([key, a]) =>
          `<label class="addon-item"><input type="checkbox" name="addons" value="${key}" checked> ${a.name} <span class="count">${Object.keys(a.catalogMap).length} catalogs</span></label>`,
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plex Bridge - Configuration</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;justify-content:center;padding:20px}
.container{max-width:640px;width:100%;padding:32px 0}
h1{font-size:28px;margin-bottom:8px;color:#fff}
h2{font-size:18px;margin-top:32px;margin-bottom:12px;color:#e5a00d;border-bottom:1px solid #333;padding-bottom:8px}
p{color:#999;font-size:14px;margin-bottom:16px;line-height:1.6}
.card{background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:20px}
label.addon-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:6px;cursor:pointer;transition:background .15s;font-size:14px}
label.addon-item:hover{background:#222}
label.addon-item input{accent-color:#e5a00d}
.count{color:#666;font-size:12px;margin-left:auto}
input[type="text"]{width:100%;padding:10px 14px;border:1px solid #444;border-radius:8px;background:#0a0a0a;color:#fff;font-size:14px;margin-bottom:12px;outline:none}
input[type="text"]:focus{border-color:#e5a00d}
button{padding:12px 24px;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s}
.btn-primary{background:#e5a00d;color:#000}
.btn-primary:hover{background:#cc8e00}
.btn-primary:disabled{background:#555;color:#888;cursor:wait}
.btn-secondary{background:#333;color:#ccc;margin-left:8px}
.btn-secondary:hover{background:#444}
.actions{display:flex;gap:8px;margin-top:16px}
.step{display:flex;gap:12px;margin-bottom:16px;padding:12px;background:#111;border-radius:8px;border:1px solid #222}
.step-num{background:#e5a00d;color:#000;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
.step-content{flex:1}
.step-content h3{font-size:14px;color:#fff;margin-bottom:4px}
.step-content p{font-size:13px;margin-bottom:0}
code{background:#222;padding:2px 6px;border-radius:4px;font-size:12px;color:#e5a00d}
.progress{display:none;margin-top:12px;padding:12px;background:#111;border-radius:8px;border:1px solid #333}
.progress-bar{height:4px;background:#333;border-radius:2px;overflow:hidden;margin-top:8px}
.progress-fill{height:100%;background:#e5a00d;width:0%;transition:width .3s}
.arch-section{margin-top:24px;padding:16px;background:#111;border:1px solid #333;border-radius:8px}
.arch-section h3{color:#e5a00d;font-size:14px;margin-bottom:8px}
.arch-section p{font-size:13px;color:#888}
.flow{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:12px 0}
.flow span{background:#1a1a1a;padding:4px 10px;border-radius:4px;font-size:12px;border:1px solid #333}
.flow .arrow{background:none;border:none;color:#e5a00d;font-weight:bold}
</style>
</head><body>
<div class="container">
<h1>Plex Bridge</h1>
<p>Stream your Stremio add-on catalogs directly in Plex Media Player. No downloads, no storage — streams are resolved on-demand.</p>

<h2>Architecture</h2>
<div class="arch-section">
<h3>How It Works</h3>
<p>This bridge generates <code>.strm</code> files (containing stream URLs) and <code>.nfo</code> metadata files that Plex can read natively. When you play a title in Plex, it calls back to this server to resolve the stream in real-time.</p>
<div class="flow">
<span>Plex opens .strm</span><span class="arrow">&rarr;</span>
<span>Server resolves stream</span><span class="arrow">&rarr;</span>
<span>Picks best source</span><span class="arrow">&rarr;</span>
<span>Redirects to stream</span><span class="arrow">&rarr;</span>
<span>Plex plays video</span>
</div>
<p style="margin-top:8px">Uses STRM + NFO approach (virtual filesystem). No Plex plugin required. Works with any Plex installation.</p>
</div>

<h2>Configuration</h2>
<div class="card">
<label style="display:block;font-size:14px;font-weight:500;margin-bottom:6px;color:#ccc">Server URL</label>
<input type="text" id="serverUrl" value="${baseUrl}" placeholder="https://your-deployed-server.com">
<p style="font-size:12px;color:#666;margin-top:-8px">The public URL of this server. If deploying on Vercel/Netlify, use your deployment URL.</p>

<label style="display:block;font-size:14px;font-weight:500;margin-bottom:8px;margin-top:16px;color:#ccc">Select Add-ons</label>
<div id="addonList">
${addonList}
</div>

<div class="actions">
<button class="btn-primary" id="exportBtn" onclick="exportLibrary()">Download Library (.zip)</button>
<button class="btn-secondary" onclick="copyStreamUrl()">Copy Stream Test URL</button>
</div>

<div class="progress" id="progress">
<span id="progressText">Preparing library...</span>
<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
</div>
</div>

<h2>Setup Guide</h2>
<div class="step"><div class="step-num">1</div><div class="step-content"><h3>Download the Library</h3><p>Select your add-ons above and click "Download Library". This generates a ZIP with <code>.strm</code> and <code>.nfo</code> files.</p></div></div>
<div class="step"><div class="step-num">2</div><div class="step-content"><h3>Extract to a Folder</h3><p>Extract the ZIP to a folder on the machine running Plex Media Server. Example: <code>/media/stremio-library/</code></p></div></div>
<div class="step"><div class="step-num">3</div><div class="step-content"><h3>Add Library in Plex</h3><p>Open Plex &rarr; Settings &rarr; Libraries &rarr; Add Library. Choose "Other Videos" or "Movies". Point it to your extracted folder.</p></div></div>
<div class="step"><div class="step-num">4</div><div class="step-content"><h3>Configure Metadata Agent</h3><p>In the library's Advanced settings, set the scanner to "Plex Video Files Scanner" and agent to "Personal Media". Enable "Local Media Assets" so Plex reads the <code>.nfo</code> files for titles and posters.</p></div></div>
<div class="step"><div class="step-num">5</div><div class="step-content"><h3>Browse and Play</h3><p>Plex will scan the library and show all titles with posters. Click any title and hit Play — the stream is resolved live from this server.</p></div></div>

<h2>Stream Resolution Endpoint</h2>
<div class="card">
<p>Each <code>.strm</code> file points to: <code>{server}/plex/stream/{addon}/{encodedId}</code></p>
<p>When Plex opens this URL, the server:</p>
<p>1. Resolves available streams from the source site<br>
2. Picks the best quality direct stream (MP4 &gt; HLS &gt; proxy)<br>
3. Redirects Plex to the playable URL</p>
<p style="margin-top:8px;color:#e5a00d;font-size:12px">Streams are never cached or stored. URLs are resolved fresh each time for maximum reliability.</p>
</div>

<h2>API Endpoints</h2>
<div class="card">
<p><code>GET /plex/configure</code> — This page</p>
<p><code>GET /plex/stream/:addon/:id</code> — Stream resolver (resolves &amp; redirects)</p>
<p><code>GET /plex/export?addons=gxtapes,nurgay&amp;server=URL</code> — Download STRM/NFO library ZIP</p>
<p><code>GET /plex/api/library?addons=gxtapes,nurgay</code> — JSON catalog for custom sync scripts</p>
</div>

<h2>Refreshing Content</h2>
<div class="card">
<p>Catalogs are dynamic — new content appears daily. To update your Plex library:</p>
<p>1. Re-download the library ZIP from this page<br>
2. Extract to the same folder (overwrite existing files)<br>
3. Plex will automatically detect changes on its next scan</p>
<p style="margin-top:8px;font-size:12px;color:#666">Tip: You can automate this with a cron job calling the <code>/plex/api/library</code> endpoint.</p>
</div>
</div>

<script>
function getSelectedAddons(){
  return Array.from(document.querySelectorAll('input[name="addons"]:checked')).map(el=>el.value);
}

async function exportLibrary(){
  const addons = getSelectedAddons();
  if(addons.length===0){alert('Select at least one add-on');return;}
  const server = document.getElementById('serverUrl').value.replace(/\\/+$/,'');
  if(!server){alert('Enter a server URL');return;}
  const btn = document.getElementById('exportBtn');
  const prog = document.getElementById('progress');
  btn.disabled=true;
  btn.textContent='Generating...';
  prog.style.display='block';
  document.getElementById('progressText').textContent='Fetching catalogs and generating library...';
  document.getElementById('progressFill').style.width='30%';
  try{
    const url = server+'/plex/export?addons='+addons.join(',')+'&server='+encodeURIComponent(server);
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('Export failed: '+resp.statusText);
    document.getElementById('progressFill').style.width='90%';
    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plex-stremio-library.zip';
    a.click();
    document.getElementById('progressFill').style.width='100%';
    document.getElementById('progressText').textContent='Library downloaded! Extract to your Plex media folder.';
  }catch(e){
    alert('Export failed: '+e.message);
    prog.style.display='none';
  }
  btn.disabled=false;
  btn.textContent='Download Library (.zip)';
}

function copyStreamUrl(){
  const server = document.getElementById('serverUrl').value.replace(/\\/+$/,'');
  const url = server+'/plex/stream/gxtapes/test';
  navigator.clipboard.writeText(url);
  alert('Stream resolver URL copied. Use this pattern in your STRM files.');
}
</script>
</body></html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  app.get("/plex/stream/:addon/:encodedId", async (req: Request, res: Response) => {
    const { addon, encodedId } = req.params;
    const addonDef = ADDON_REGISTRY[addon];
    if (!addonDef) {
      return res.status(404).json({ error: "Unknown addon: " + addon });
    }

    const fullId = `${addon}:${encodedId}`;
    const baseUrl = getRequestBaseUrl(req);
    log(`Plex stream request: ${addon}/${encodedId}`, "plex");

    try {
      const streams = await addonDef.getStreams(fullId, baseUrl);
      const best = selectBestStream(streams);

      if (!best || !best.url) {
        log(`Plex stream: no playable stream found for ${fullId}`, "plex");
        return res.status(404).json({ error: "No playable stream found" });
      }

      log(`Plex stream: redirecting to ${best.url.substring(0, 80)}...`, "plex");
      res.redirect(302, best.url);
    } catch (err: any) {
      log(`Plex stream error: ${err.message}`, "plex");
      res.status(500).json({ error: "Stream resolution failed" });
    }
  });

  app.get("/plex/api/library", async (req: Request, res: Response) => {
    const addonKeys = (req.query.addons as string || Object.keys(ADDON_REGISTRY).join(","))
      .split(",")
      .filter((k) => k in ADDON_REGISTRY);

    const result: Record<string, { name: string; items: CatalogItem[] }> = {};

    for (const key of addonKeys) {
      const addon = ADDON_REGISTRY[key];
      const allItems: CatalogItem[] = [];
      const seen = new Set<string>();

      for (const catalogId of Object.keys(addon.catalogMap)) {
        try {
          const items = await addon.getCatalog(catalogId, 0);
          for (const item of items) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              allItems.push(item);
            }
          }
        } catch {
          continue;
        }
      }

      result[key] = { name: addon.name, items: allItems };
    }

    res.json(result);
  });

  app.get("/plex/export", async (req: Request, res: Response) => {
    const addonKeys = (req.query.addons as string || Object.keys(ADDON_REGISTRY).join(","))
      .split(",")
      .filter((k) => k in ADDON_REGISTRY);
    const serverUrl = (req.query.server as string || getRequestBaseUrl(req)).replace(/\/+$/, "");

    if (addonKeys.length === 0) {
      return res.status(400).json({ error: "No valid addons specified" });
    }

    log(`Plex export: generating library for ${addonKeys.join(", ")}`, "plex");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="plex-stremio-library.zip"');

    const archive = archiver("zip", { zlib: { level: 5 } });
    archive.pipe(res);

    archive.on("error", (err: Error) => {
      log(`Plex export error: ${err.message}`, "plex");
      if (!res.headersSent) {
        res.status(500).json({ error: "Export failed" });
      }
    });

    for (const addonKey of addonKeys) {
      const addon = ADDON_REGISTRY[addonKey];
      const seen = new Set<string>();
      const catalogIds = Object.keys(addon.catalogMap);

      for (const catalogId of catalogIds) {
        try {
          const items = await addon.getCatalog(catalogId, 0);

          for (const item of items) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);

            const idPart = item.id.replace(`${addonKey}:`, "");
            const safeName = sanitizeFilename(item.name);
            const folderPath = `${addon.name}/${safeName}`;

            const strmUrl = `${serverUrl}/plex/stream/${addonKey}/${idPart}`;
            archive.append(strmUrl, { name: `${folderPath}/${safeName}.strm` });

            const nfo = generateNfo(item.name, item.poster);
            archive.append(nfo, { name: `${folderPath}/${safeName}.nfo` });
          }
        } catch (err: any) {
          log(`Plex export: catalog ${catalogId} failed: ${err.message}`, "plex");
          continue;
        }
      }
    }

    await archive.finalize();
    log(`Plex export: completed`, "plex");
  });
}
