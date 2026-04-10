import { fetchPage } from "../stremio/http";
import * as cheerio from "cheerio";
import { resolveEmbedUrl, deduplicateStreams, getHostLabel } from "../stremio/resolvers";
import { sortStreamsByQuality } from "../stremio/quality";
import type { ResolvedStream } from "../stremio/resolvers";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

export async function extractFxggxtStreams(pageUrl: string): Promise<ResolvedStream[]> {
  try {
    const html = await fetchPage(pageUrl, { referer: "https://fxggxt.com/" });
    const $ = cheerio.load(html);

    let embedUrl: string | undefined;

    const iframeEl = $("div.responsive-player iframe").first();
    if (iframeEl.length) {
      embedUrl = iframeEl.attr("data-lazy-src") || iframeEl.attr("data-src") || iframeEl.attr("src");
    }

    if (!embedUrl || embedUrl === "about:blank") {
      const noscriptHtml = $("div.responsive-player noscript").html();
      if (noscriptHtml) {
        const $n = cheerio.load(noscriptHtml);
        embedUrl = $n("iframe").attr("src");
      }
    }

    if (!embedUrl || embedUrl === "about:blank") {
      embedUrl = $('meta[itemprop="embedURL"]').attr("content");
    }

    if (!embedUrl || embedUrl === "about:blank") {
      if (isDebug()) console.log(`[Fxggxt] No iframe found on ${pageUrl}`);
      return [];
    }

    const fullSrc = embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl;
    if (isDebug()) console.log(`[Fxggxt] Found iframe: ${fullSrc}`);

    const resolved = await resolveEmbedUrl(fullSrc, pageUrl);

    if (resolved.length === 0) {
      if (isDebug()) console.log(`[Fxggxt] Embed resolution yielded no streams for ${fullSrc}`);
      return [];
    }

    return sortStreamsByQuality(deduplicateStreams(resolved));
  } catch (err: any) {
    if (isDebug()) console.error(`[Fxggxt] Page extraction error: ${err.message}`);
    return [];
  }
}
