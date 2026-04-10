import { fetchPage } from "../stremio/http.js";
import * as cheerio from "cheerio";
import { resolveEmbedUrl, deduplicateStreams } from "../stremio/resolvers.js";
import { sortStreamsByQuality } from "../stremio/quality.js";
import type { ResolvedStream } from "../stremio/resolvers.js";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

const AD_DOMAINS = [
  "juicyads.com", "adserver.", "jads.co", "trafficjunky",
  "exoclick", "chaseherbalpasty",
];

function isAdUrl(url: string): boolean {
  return AD_DOMAINS.some((ad) => url.toLowerCase().includes(ad));
}

export async function extractGaycock4uStreams(pageUrl: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];

  try {
    const html = await fetchPage(pageUrl, { referer: "https://gaycock4u.com/" });
    const $ = cheerio.load(html);

    const iframeSrcs: string[] = [];

    const selectors = [
      ".davideo iframe[src], .davideo iframe[data-src], .davideo iframe[data-lazy-src]",
      ".responsive-player iframe[src], .responsive-player iframe[data-src], .responsive-player iframe[data-lazy-src]",
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const src = $(el).attr("data-lazy-src") || $(el).attr("data-src") || $(el).attr("src");
        if (src && src !== "about:blank") {
          const normalized = src.startsWith("//") ? `https:${src}` : src;
          if (normalized.startsWith("http") && !isAdUrl(normalized) && !iframeSrcs.includes(normalized)) {
            iframeSrcs.push(normalized);
          }
        }
      });
    }

    if (iframeSrcs.length === 0) {
      $("iframe[src], iframe[data-src], iframe[data-lazy-src]").each((_, el) => {
        const src = $(el).attr("data-lazy-src") || $(el).attr("data-src") || $(el).attr("src");
        if (src && src !== "about:blank") {
          const normalized = src.startsWith("//") ? `https:${src}` : src;
          if (normalized.startsWith("http") && !isAdUrl(normalized) && !iframeSrcs.includes(normalized)) {
            iframeSrcs.push(normalized);
          }
        }
      });
    }

    if (iframeSrcs.length === 0) {
      $("noscript").each((_, el) => {
        const nhtml = $(el).html();
        if (nhtml) {
          const $n = cheerio.load(nhtml);
          $n("iframe[src]").each((_, iel) => {
            const src = $n(iel).attr("src");
            if (src && src !== "about:blank" && src.startsWith("http") && !isAdUrl(src) && !iframeSrcs.includes(src)) {
              iframeSrcs.push(src);
            }
          });
        }
      });
    }

    if (iframeSrcs.length === 0) {
      const metaEmbed = $('meta[itemprop="embedURL"]').attr("content");
      if (metaEmbed && !isAdUrl(metaEmbed)) iframeSrcs.push(metaEmbed);
    }

    if (iframeSrcs.length === 0) {
      if (isDebug()) console.log(`[Gaycock4U] No iframes found on ${pageUrl}`);
      return [];
    }

    if (isDebug()) console.log(`[Gaycock4U] ${iframeSrcs.length} iframes found`);

    const results = await Promise.allSettled(
      iframeSrcs.map((src) => resolveEmbedUrl(src, pageUrl))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        streams.push(...result.value);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Gaycock4U] Page extraction error: ${err.message}`);
  }

  return sortStreamsByQuality(deduplicateStreams(streams));
}
