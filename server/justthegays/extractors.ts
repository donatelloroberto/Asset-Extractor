import { fetchPage } from "../stremio/http.js";
import * as cheerio from "cheerio";

const isDebug = () => process.env.DEBUG === "1";

export interface ExtractedStream {
  name: string;
  url?: string;
  externalUrl?: string;
  quality?: string;
  referer?: string;
}

const VIDEO_URL_REGEX = /https?:\/\/[^\s'"]+?\.(?:mp4|m3u8|webm)(\?[^'"\s<>]*)?/g;

const EXCLUDED_DOMAINS = [
  "pinterest.com", "facebook.com", "twitter.com", "instagram.com",
  "google.com", "googleapis.com", "gstatic.com", "youtube.com",
];

function getStreamLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("aucdn.net")) return "CDN";
    return "Direct";
  } catch {
    return "Direct";
  }
}

function isValidVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (EXCLUDED_DOMAINS.some(d => lower.includes(d))) return false;
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$|&)/)) return false;
  if (lower.includes("button") || lower.includes("share") || lower.includes("pin/create")) return false;
  return true;
}

function extractVideoUrls(text: string): string[] {
  const matches = text.match(VIDEO_URL_REGEX);
  if (!matches) return [];
  return matches
    .map(m => m.replace(/['">\s]+$/, ""))
    .filter(isValidVideoUrl);
}

export async function extractJustthegaysStreams(pageUrl: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  const seenUrls = new Set<string>();

  function addStream(url: string) {
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    streams.push({
      name: getStreamLabel(url),
      url,
      referer: pageUrl,
    });
  }

  try {
    const html = await fetchPage(pageUrl, { referer: "https://justthegays.com/" });
    const $ = cheerio.load(html);

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html() || "";
        const urls = extractVideoUrls(text);
        for (const u of urls) addStream(u);
      } catch {}
    });

    $("video source, video[src], video[data-src]").each((_, el) => {
      const $el = $(el);
      const src = $el.attr("src") || $el.attr("data-src");
      if (src && /\.(mp4|m3u8|webm)/.test(src)) {
        const fullUrl = src.startsWith("http") ? src : (src.startsWith("//") ? `https:${src}` : `https://justthegays.com${src}`);
        addStream(fullUrl);
      }
    });
    $("source[src], source[data-src]").each((_, el) => {
      const $el = $(el);
      const src = $el.attr("src") || $el.attr("data-src");
      if (src && /\.(mp4|m3u8|webm)/.test(src)) {
        const fullUrl = src.startsWith("http") ? src : (src.startsWith("//") ? `https:${src}` : `https://justthegays.com${src}`);
        addStream(fullUrl);
      }
    });

    const iframeSrcs: string[] = [];
    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        const fullSrc = src.startsWith("//") ? `https:${src}` : src;
        if (fullSrc.startsWith("http")) {
          iframeSrcs.push(fullSrc);
        }
      }
    });

    for (const iframeSrc of iframeSrcs) {
      try {
        const iframeHtml = await fetchPage(iframeSrc, { referer: pageUrl });
        const urls = extractVideoUrls(iframeHtml);
        for (const u of urls) addStream(u);
      } catch (err: any) {
        if (isDebug()) console.error(`[Justthegays] iframe fetch error for ${iframeSrc}: ${err.message}`);
      }
    }

    if (streams.length === 0) {
      const urls = extractVideoUrls(html);
      for (const u of urls) addStream(u);
    }

    if (streams.length === 0) {
      if (isDebug()) console.log(`[Justthegays] No direct streams found, using embed fallback for ${pageUrl}`);
      streams.push({
        name: "JustTheGays Player",
        externalUrl: pageUrl,
        referer: pageUrl,
      });
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Justthegays] Page extraction error: ${err.message}`);
  }

  return streams;
}
