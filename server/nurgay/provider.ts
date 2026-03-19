import * as cheerio from "cheerio";
import { fetchPage } from "../stremio/http.js";
import { makeId, extractUrl } from "./ids.js";
import { getCached, setCached } from "../stremio/cache.js";
import { extractNurgayStreams } from "./extractors.js";
import { NURGAY_CATALOG_MAP } from "./manifest.js";
import { stremioMetaSchema, type StremioMeta, type StremioStream, type CatalogItem } from "../../shared/schema.js";
import { mapStreamsForStremio } from "../stremio/stream-mapper.js";

const BASE_URL = "https://nurgay.to";
const isDebug = () => process.env.DEBUG === "1";

function fixUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function parseArticles($: cheerio.CheerioAPI): CatalogItem[] {
  const items: CatalogItem[] = [];
  $("article.loop-video").each((_, el) => {
    const $el = $(el);
    const title = $el.find("header.entry-header span").text().trim();
    const href = $el.find("a").first().attr("href");
    const posterRaw = $el.find("img").attr("data-lazy-src") || $el.find("img").attr("data-src") || $el.find("img").attr("src");
    const poster = posterRaw && !posterRaw.startsWith("data:") ? posterRaw : undefined;

    if (href && title) {
      const fullUrl = fixUrl(href);
      items.push({
        id: makeId(fullUrl),
        name: title,
        poster: poster ? fixUrl(poster) : undefined,
        type: "movie",
      });
    }
  });
  return items;
}

export async function getNurgayCatalog(catalogId: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `nurgay-catalog:${catalogId}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const catalogDef = NURGAY_CATALOG_MAP[catalogId];
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

  if (isDebug()) console.log(`[Nurgay] Fetching catalog: ${url}`);

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const items = parseArticles($);

    setCached("catalog", cacheKey, items);
    return items;
  } catch (err: any) {
    if (isDebug()) console.error(`[Nurgay] Catalog error:`, err.message);
    return [];
  }
}

export async function searchNurgayContent(query: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `nurgay-search:${query}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const allItems: CatalogItem[] = [];
  const maxPages = 3;
  const startPage = Math.floor(skip / 24) + 1;

  for (let page = startPage; page < startPage + maxPages; page++) {
    try {
      const url = page === 1
        ? `${BASE_URL}/?s=${encodeURIComponent(query)}`
        : `${BASE_URL}/?s=${encodeURIComponent(query)}&page=${page}`;
      if (isDebug()) console.log(`[Nurgay] Search page ${page}: ${url}`);

      const html = await fetchPage(url);
      const $ = cheerio.load(html);
      const items = parseArticles($);

      if (items.length === 0) break;

      for (const item of items) {
        if (!allItems.some(i => i.id === item.id)) {
          allItems.push(item);
        }
      }
    } catch (err: any) {
      if (isDebug()) console.error(`[Nurgay] Search error:`, err.message);
      break;
    }
  }

  setCached("catalog", cacheKey, allItems);
  return allItems;
}

export async function getNurgayMeta(id: string): Promise<StremioMeta | null> {
  const cacheKey = `nurgay-meta:${id}`;
  const cached = getCached<StremioMeta>("meta", cacheKey);
  if (cached) return cached;

  try {
    const url = extractUrl(id);
    if (isDebug()) console.log(`[Nurgay] Getting meta for: ${url}`);

    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const videoEl = $('article[itemtype="http://schema.org/VideoObject"]');

    const title = videoEl.find('meta[itemprop="name"]').attr("content")?.trim()
      || $('meta[property="og:title"]').attr("content")?.trim()
      || $("h1.entry-title").text().trim()
      || $("title").text().trim()
      || "Unknown";
    const poster = videoEl.find('meta[itemprop="thumbnailUrl"]').attr("content")?.trim()
      || $('meta[property="og:image"]').attr("content")?.trim();
    const description = videoEl.find('meta[itemprop="description"]').attr("content")?.trim()
      || $('meta[property="og:description"]').attr("content")?.trim()
      || $(".video-description .desc").text().trim();

    const actors = $('#video-actors a').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    const meta: StremioMeta = {
      id,
      type: "movie",
      name: title,
      poster: poster || undefined,
      posterShape: "poster",
      background: poster || undefined,
      description: description || undefined,
    };

    if (actors.length > 0) {
      (meta as any).cast = actors;
    }

    const validatedMeta = stremioMetaSchema.safeParse(meta);
    if (!validatedMeta.success) {
      if (isDebug()) console.error(`[Nurgay] Meta validation error:`, validatedMeta.error.message);
      return null;
    }

    setCached("meta", cacheKey, validatedMeta.data);
    return validatedMeta.data;
  } catch (err: any) {
    if (isDebug()) console.error(`[Nurgay] Meta error:`, err.message);
    return null;
  }
}

export async function getNurgayStreams(id: string, baseUrl?: string): Promise<StremioStream[]> {
  try {
    const url = extractUrl(id);
    if (isDebug()) console.log(`[Nurgay] Getting streams for: ${url}`);

    const extracted = await extractNurgayStreams(url);
    const streams = await mapStreamsForStremio(extracted, baseUrl);

    return streams;
  } catch (err: any) {
    if (isDebug()) console.error(`[Nurgay] Stream error:`, err.message);
    return [];
  }
}
