import { fetchPage } from "../stremio/http";
import * as cheerio from "cheerio";
import {
  resolveEmbedUrl,
  deduplicateStreams,
  getHostLabel,
  resolveListmirror,
} from "../stremio/resolvers";
import { sortStreamsByQuality } from "../stremio/quality";
import type { ResolvedStream } from "../stremio/resolvers";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

const STREAM_HOSTS = [
  "voe.sx", "voe.to", "jilliandescribecompany.com", "markstylecompany.com",
  "primaryclassaliede.com", "doodstream.com", "ds2video.com", "d0o0d.com",
  "d-s.io", "vide0.net", "myvidplay.com", "dood.", "dsvplay.com",
  "streamtape.com", "streamtape.to", "tapepops.com",
  "filemoon.to", "filemoon.sx",
  "bigwarp.io", "bigwarp.cc", "bgwp.cc",
  "listmirror.com",
  "mixdrop.co", "mixdrop.to",
  "vinovo.si", "vinovo.to",
  "vidoza.net",
];

function isStreamHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return STREAM_HOSTS.some((h) => hostname.includes(h));
  } catch {
    return false;
  }
}

export async function extractNurgayStreams(pageUrl: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];

  try {
    const html = await fetchPage(pageUrl, { referer: "https://nurgay.to/" });
    const $ = cheerio.load(html);

    const embedEntries: { url: string; label: string }[] = [];

    let iframeSrc: string | undefined;
    const iframeEl = $(".video-player iframe, .responsive-player iframe").first();
    if (iframeEl.length) {
      iframeSrc = iframeEl.attr("data-lazy-src") || iframeEl.attr("data-src") || iframeEl.attr("src");
    }
    if (!iframeSrc || iframeSrc === "about:blank") {
      const noscriptHtml = $(".video-player noscript, .responsive-player noscript").html();
      if (noscriptHtml) {
        const $n = cheerio.load(noscriptHtml);
        iframeSrc = $n("iframe").attr("src");
      }
    }
    if (!iframeSrc || iframeSrc === "about:blank") {
      iframeSrc = $('meta[itemprop="embedURL"]').attr("content");
    }

    if (iframeSrc && iframeSrc !== "about:blank") {
      const fullSrc = iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc;
      if (isDebug()) console.log(`[Nurgay] Found iframe: ${fullSrc}`);
      embedEntries.push({ url: fullSrc, label: getHostLabel(fullSrc) });
    }

    $("ul#mirrorMenu a.mirror-opt, a.dropdown-item.mirror-opt").each((_, el) => {
      const dataUrl = $(el).attr("data-url");
      const label = $(el).text().trim();
      if (dataUrl && dataUrl !== "#") {
        const fullUrl = dataUrl.startsWith("//") ? `https:${dataUrl}` : dataUrl;
        if (!embedEntries.some((e) => e.url === fullUrl)) {
          embedEntries.push({ url: fullUrl, label: label || getHostLabel(fullUrl) });
        }
      }
    });

    $(".notranslate a[href], .entry-content a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href && isStreamHost(href) && !embedEntries.some((e) => e.url === href)) {
        embedEntries.push({ url: href, label: getHostLabel(href) });
      }
    });

    if (isDebug())
      console.log(`[Nurgay] ${embedEntries.length} embed URLs found:`, embedEntries.map((e) => `${e.label}: ${e.url}`));

    const results = await Promise.allSettled(
      embedEntries.map(({ url }) => resolveEmbedUrl(url, pageUrl))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        streams.push(...result.value);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Nurgay] Page extraction error: ${err.message}`);
  }

  return sortStreamsByQuality(deduplicateStreams(streams));
}
