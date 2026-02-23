import * as cheerio from "cheerio";
import { fetchPage } from "../stremio/http";
import { makeId, extractUrl } from "./ids";
import { getCached, setCached } from "../stremio/cache";
import { extractGaycock4uStreams } from "./extractors";
import { GAYCOCK4U_CATALOG_MAP } from "./manifest";
import type { StremioMeta, StremioStream, CatalogItem } from "../../shared/schema";

const BASE_URL = "https://gaycock4u.com";
const isDebug = () => process.env.DEBUG === "1";

function fixUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function parseArticles($: cheerio.CheerioAPI): CatalogItem[] {
  const items: CatalogItem[] = [];
  $("div.elementor-widget-container article.elementor-post").each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find("p.elementor-heading-title a");
    const title = titleEl.text().trim();
    const href = $el.find("a").first().attr("href");
    const poster = $el.find("a img").attr("src");

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

export async function getGaycock4uCatalog(catalogId: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `gaycock4u-catalog:${catalogId}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const catalogDef = GAYCOCK4U_CATALOG_MAP[catalogId];
  if (!catalogDef) return [];

  const page = Math.floor(skip / 24) + 1;
  let url: string;

  if (page > 1) {
    url = `${BASE_URL}${catalogDef.path}page/${page}/`;
  } else {
    url = `${BASE_URL}${catalogDef.path}`;
  }

  if (isDebug()) console.log(`[Gaycock4U] Fetching catalog: ${url}`);

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const items = parseArticles($);

    setCached("catalog", cacheKey, items);
    return items;
  } catch (err: any) {
    if (isDebug()) console.error(`[Gaycock4U] Catalog error:`, err.message);
    return [];
  }
}

export async function searchGaycock4uContent(query: string, skip: number = 0): Promise<CatalogItem[]> {
  const cacheKey = `gaycock4u-search:${query}:${skip}`;
  const cached = getCached<CatalogItem[]>("catalog", cacheKey);
  if (cached) return cached;

  const allItems: CatalogItem[] = [];
  const maxPages = 5;
  const startPage = Math.floor(skip / 24) + 1;

  for (let page = startPage; page < startPage + maxPages; page++) {
    try {
      const url = `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`;
      if (isDebug()) console.log(`[Gaycock4U] Search page ${page}: ${url}`);

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
      if (isDebug()) console.error(`[Gaycock4U] Search error:`, err.message);
      break;
    }
  }

  setCached("catalog", cacheKey, allItems);
  return allItems;
}

export async function getGaycock4uMeta(id: string): Promise<StremioMeta | null> {
  const cacheKey = `gaycock4u-meta:${id}`;
  const cached = getCached<StremioMeta>("meta", cacheKey);
  if (cached) return cached;

  try {
    const url = extractUrl(id);
    if (isDebug()) console.log(`[Gaycock4U] Getting meta for: ${url}`);

    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr("content")?.trim()
      || $("title").text().trim()
      || "Unknown";
    const poster = $('meta[property="og:image"]').attr("content")?.trim();
    const description = $('meta[property="og:description"]').attr("content")?.trim();

    const meta: StremioMeta = {
      id,
      type: "movie",
      name: title,
      poster: poster || undefined,
      posterShape: "poster",
      background: poster || undefined,
      description: description || undefined,
    };

    setCached("meta", cacheKey, meta);
    return meta;
  } catch (err: any) {
    if (isDebug()) console.error(`[Gaycock4U] Meta error:`, err.message);
    return null;
  }
}

export async function getGaycock4uStreams(id: string, baseUrl?: string): Promise<StremioStream[]> {
  try {
    const url = extractUrl(id);
    if (isDebug()) console.log(`[Gaycock4U] Getting streams for: ${url}`);

    const extracted = await extractGaycock4uStreams(url);
    const streams: StremioStream[] = extracted.map(s => {
      if (s.externalUrl && !s.url) {
        return {
          name: s.name,
          title: `${s.name} - Open in Browser`,
          externalUrl: s.externalUrl,
        };
      }

      let streamUrl = s.url!;
      if (baseUrl) {
        const params = new URLSearchParams({ url: streamUrl });
        if (s.referer) params.set("referer", s.referer);
        streamUrl = `${baseUrl}/proxy/stream?${params.toString()}`;
      }

      const hints: any = { notWebReady: false };
      return {
        name: s.name,
        title: s.quality ? `${s.name} - ${s.quality}` : s.name,
        url: streamUrl,
        behaviorHints: hints,
      };
    });

    return streams;
  } catch (err: any) {
    if (isDebug()) console.error(`[Gaycock4U] Stream error:`, err.message);
    return [];
  }
}
