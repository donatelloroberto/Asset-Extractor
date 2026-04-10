import { fetchPage } from "../stremio/http";
import * as cheerio from "cheerio";
import { deduplicateStreams, resolveEmbedUrl } from "../stremio/resolvers";
import { sortStreamsByQuality } from "../stremio/quality";
import type { ResolvedStream } from "../stremio/resolvers";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

const VIDEO_URL_REGEX = /https?:\/\/[^\s'"]+?\.(?:mp4|m3u8|webm)(\?[^'"\s<>]*)?/g;

function getStreamLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("aucdn.net")) return "CDN";
    if (hostname.includes("besthdgayporn.com")) return "Origin";
    return "Direct";
  } catch {
    return "Direct";
  }
}

function extractVideoUrls(text: string): string[] {
  const matches = text.match(VIDEO_URL_REGEX);
  if (!matches) return [];
  return matches.map((m) => m.replace(/['">\s]+$/, ""));
}

export async function extractBesthdgaypornStreams(pageUrl: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  const seenUrls = new Set<string>();

  function addStream(url: string, label?: string) {
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    streams.push({
      name: label || getStreamLabel(url),
      url,
      referer: pageUrl,
    });
  }

  try {
    const html = await fetchPage(pageUrl, { referer: "https://besthdgayporn.com/" });
    const $ = cheerio.load(html);

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html() || "";
        for (const u of extractVideoUrls(text)) addStream(u);
      } catch {}
    });

    $("video source, video[src], video[data-src], source[src], source[data-src]").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && /\.(mp4|m3u8|webm)/.test(src)) {
        const fullUrl = src.startsWith("http")
          ? src
          : src.startsWith("//")
          ? `https:${src}`
          : `https://besthdgayporn.com${src}`;
        addStream(fullUrl);
      }
    });

    const iframeSrcs: string[] = [];
    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        const fullSrc = src.startsWith("//") ? `https:${src}` : src;
        if (fullSrc.startsWith("http")) iframeSrcs.push(fullSrc);
      }
    });

    const iframeResults = await Promise.allSettled(
      iframeSrcs.map(async (iframeSrc) => {
        const resolved = await resolveEmbedUrl(iframeSrc, pageUrl);
        return { iframeSrc, resolved };
      })
    );

    for (const result of iframeResults) {
      if (result.status === "fulfilled") {
        const { iframeSrc, resolved } = result.value;
        if (resolved.length > 0) {
          for (const s of resolved) {
            if (s.url && !seenUrls.has(s.url)) {
              seenUrls.add(s.url);
              streams.push(s);
            }
          }
        } else {
          try {
            const iframeHtml = await fetchPage(iframeSrc, { referer: pageUrl });
            for (const u of extractVideoUrls(iframeHtml)) addStream(u);
          } catch {}
        }
      }
    }

    if (streams.length === 0) {
      for (const u of extractVideoUrls(html)) addStream(u);
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[BestHDgayporn] Page extraction error: ${err.message}`);
  }

  return sortStreamsByQuality(deduplicateStreams(streams));
}
