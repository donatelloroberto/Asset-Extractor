import { fetchPage } from "./http.js";
import * as cheerio from "cheerio";
import {
  resolveEmbedUrl,
  deduplicateStreams,
  findEvalBlock,
  unpack,
  resolveDood,
} from "./resolvers.js";
import { sortStreamsByQuality } from "./quality.js";
import type { ResolvedStream } from "./resolvers.js";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

export async function extractStreams(pageUrl: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];

  try {
    const html = await fetchPage(pageUrl);
    const $ = cheerio.load(html);

    const iframes: string[] = [];

    $("#video-code iframe, .video-embed iframe, #player iframe, .player iframe").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("SRC");
      if (src) iframes.push(src);
    });

    const iframeSrcMatches = html.match(/<IFRAME[^>]*SRC="([^"]+)"/gi) || [];
    for (const m of iframeSrcMatches) {
      const srcMatch = m.match(/SRC="([^"]+)"/i);
      if (srcMatch && !iframes.includes(srcMatch[1])) {
        iframes.push(srcMatch[1]);
      }
    }

    if (isDebug()) console.log(`[Extractor] ${iframes.length} iframes on ${pageUrl}`);

    const results = await Promise.allSettled(
      iframes.map((src) => resolveEmbedUrl(src, pageUrl))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        streams.push(...result.value);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Extractor] Failed to load ${pageUrl}: ${err.message}`);
  }

  return sortStreamsByQuality(deduplicateStreams(streams));
}

export async function extractGXtapes(url: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: "https://gay.xtapes.tw/" });

    const evalBlock = findEvalBlock(html);
    if (!evalBlock) {
      if (isDebug()) console.log("[GXtapes] No packed script");
      return streams;
    }

    const unpacked = unpack(evalBlock);
    if (!unpacked) {
      if (isDebug()) console.log("[GXtapes] Unpack failed");
      return streams;
    }

    if (isDebug()) console.log("[GXtapes] Unpacked length:", unpacked.length);

    const linksMatch = unpacked.match(/var\s+links\s*=\s*\{([^}]+)\}/);
    if (linksMatch) {
      const pairs = Array.from(linksMatch[1].matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g));
      for (const [, quality, streamUrl] of pairs) {
        const fullUrl = streamUrl.startsWith("http")
          ? streamUrl
          : `${new URL(url).origin}${streamUrl.startsWith("/") ? "" : "/"}${streamUrl}`;
        streams.push({ name: `GXtapes ${quality}`, url: fullUrl, quality, referer: url });
      }
    }

    if (streams.length === 0) {
      const hlsUrls = [...new Set(unpacked.match(/https?:\/\/[^\s"'\\}]+\.m3u8[^\s"'\\}]*/g) || [])];
      for (const u of hlsUrls) streams.push({ name: "GXtapes HLS", url: u, referer: url });
    }

    if (streams.length === 0) {
      const mp4Urls = [...new Set(unpacked.match(/https?:\/\/[^\s"'\\}]+\.mp4[^\s"'\\}]*/g) || [])];
      for (const u of mp4Urls) streams.push({ name: "GXtapes MP4", url: u, referer: url });
    }

    if (streams.length === 0) {
      const fileMatch = unpacked.match(/file\s*:\s*"([^"]+)"/);
      if (fileMatch) {
        const fileUrl = fileMatch[1].startsWith("http")
          ? fileMatch[1]
          : `${new URL(url).origin}/${fileMatch[1].replace(/^\//, "")}`;
        streams.push({ name: "GXtapes", url: fileUrl, referer: url });
      }
    }

    if (isDebug()) console.log(`[GXtapes] ${streams.length} streams found`);
  } catch (err: any) {
    if (isDebug()) console.error("[GXtapes] Error:", err.message);
  }
  return sortStreamsByQuality(streams);
}

export async function extractDoodStreamLegacy(url: string): Promise<ResolvedStream[]> {
  return resolveDood(url);
}
