import * as cheerio from "cheerio";
import { fetchPage } from "./http.js";
import { makeId, extractUrl } from "./ids.js";
import { getCached, setCached } from "./cache.js";
import { extractStreams } from "./extractors.js";
import { CATALOG_MAP } from "./manifest.js";
import type { StremioMeta, StremioStream, CatalogItem } from "../../shared/schema.js";
import { mapStreamsForStremio } from "./stream-mapper.js";
import { log } from "../logger.js";

const BASE_URL = "https://gay.xtapes.tw";
const isDebug = () => process.env.DEBUG === "1";

function fixUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

export async function getCatalog(catalogId: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `catalog:${catalogId}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const catalogDef = CATALOG_MAP[catalogId];
  if (!catalogDef) return [];

  const page = Math.floor(skip / 24) + 1;
  let url: string;
  if (catalogDef.isQuery) {
    if (page > 1) {
      url = `${BASE_URL}/page/${page}${catalogDef.path}`;
    } else {
      url = `${BASE_URL}${catalogDef.path}`;
    }
  } else {
    if (page > 1) {
      url = `${BASE_URL}${catalogDef.path}page/${page}/`;
    } else {
      url = `${BASE_URL}${catalogDef.path}`;
    }
  }

  if (isDebug()) log(`Fetching catalog: ${url}`, "stremio-provider");

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const items: CatalogItem[] = [];

    $("ul.listing-tube li").each((_, el) => {
      const $el = $(el);
      const title = $el.find("img").attr("title") || $el.find("img").attr("alt") || "";
      const href = $el.find("a").attr("href");
      const posterRaw = $el.find("img").attr("data-lazy-src") || $el.find("img").attr("data-src") || $el.find("img").attr("src");
      const poster = posterRaw && !posterRaw.startsWith("data:") ? posterRaw : undefined;

      if (href && title) {
        const fullUrl = fixUrl(href);
        items.push({
          id: makeId(fullUrl),
          name: title.trim(),
          poster: poster ? fixUrl(poster) : undefined,
          type: "movie",
        });
      }
    });

    setCached("catalog", cacheKey, items);
    return items;
  } catch (err: any) {
    if (isDebug()) log(`Catalog error: ${err.message}`, "stremio-provider-error");
    return [];
  }
}

export async function searchContent(query: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `search:${query}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const allItems: CatalogItem[] = [];
  const maxPages = 3;
  const startPage = Math.floor(skip / 24) + 1;

  for (let page = startPage; page < startPage + maxPages; page++) {
    try {
      const url = `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`;
      if (isDebug()) log(`Searching content: ${url}`, "stremio-provider");

      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      let foundNew = false;
      $("ul.listing-tube li").each((_, el) => {
        const $el = $(el);
        const title = $el.find("img").attr("title") || $el.find("img").attr("alt") || "";
        const href = $el.find("a").attr("href");
        const posterRaw = $el.find("img").attr("data-lazy-src") || $el.find("img").attr("data-src") || $el.find("img").attr("src");
        const poster = posterRaw && !posterRaw.startsWith("data:") ? posterRaw : undefined;

        if (href && title) {
          const fullUrl = fixUrl(href);
          const item: CatalogItem = {
            id: makeId(fullUrl),
            name: title.trim(),
            poster: poster ? fixUrl(poster) : undefined,
            type: "movie",
          };

          if (!allItems.some(i => i.id === item.id)) {
            allItems.push(item);
            foundNew = true;
          }
        }
      });

      if (!foundNew) break;
    } catch (err: any) {
      if (isDebug()) log(`Search error: ${err.message}`, "stremio-provider-error");
      break;
    }
  }

  setCached("catalog", cacheKey, allItems);
  return allItems;
}

export async function getMeta(id: string): Promise<StremioMeta | null> {
  const cacheKey = `meta:${id}`;
  const cached = getCached<StremioMeta>("meta", cacheKey);
  if (cached) return cached;

  try {
    const url = extractUrl(id);
    if (isDebug()) log(`Getting meta for: ${url}`, "stremio-provider");

    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const videoEl = $(\'article[itemtype="http://schema.org/VideoObject"]');

    const title = videoEl.find(\'meta[itemprop="name"]\').attr("content")?.trim()
      || $(\'meta[property="og:title"]\').attr("content")?.trim()
      || $("title").text().trim() || "Unknown";
    const poster = videoEl.find(\'meta[itemprop="thumbnailUrl"]\').attr("content")?.trim()
      || $(\'meta[property="og:image"]\').attr("content")?.trim();
    const description = videoEl.find(\'meta[itemprop="description"]\').attr("content")?.trim()
      || $(\'meta[property="og:description"]\').attr("content")?.trim();

    const meta: StremioMeta = {
      id,
      type: "movie",
      name: title,
      poster: poster || undefined,
      posterShape: "landscape",
      background: poster || undefined,
      description: description || undefined,
    };

    const actors = $(\'#video-actors a\').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    if (actors.length > 0) {
      (meta as any).cast = actors;
    }

    const validatedMeta = stremioMetaSchema.safeParse(meta);
    if (!validatedMeta.success) {
      if (isDebug()) log(`Meta validation error: ${validatedMeta.error.message}`, "stremio-provider-error");
      return null;
    }
    setCached("meta", cacheKey, validatedMeta.data);
    return validatedMeta.data;
  } catch (err: any) {
    if (isDebug()) log(`Meta error: ${err.message}`, "stremio-provider-error");
    return null;
  }
}

export async function getStreams(id: string, baseUrl?: string): Promise<StremioStream[]> {
  const cacheKey = `stream:${id}`;
  const cached = getCached<StremioStream[]>("stream", cacheKey);
  if (cached) return cached;

  try {
    const url = extractUrl(id);
    if (isDebug()) log(`Getting streams for: ${url}`, "stremio-provider");

    const extracted = await extractStreams(url);
    const streams = await mapStreamsForStremio(extracted, baseUrl);

    if (streams.length > 0) {
      setCached("stream", cacheKey, streams);
    }
    return streams;
  } catch (err: any) {
    if (isDebug()) log(`Stream error: ${err.message}`, "stremio-provider-error");
    return [];
  }
}
