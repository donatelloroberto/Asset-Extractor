import { fetchPage } from "../stremio/http";
import * as cheerio from "cheerio";
import { resolveEmbedUrl, deduplicateStreams, getHostLabel } from "../stremio/resolvers";
import { sortStreamsByQuality } from "../stremio/quality";
import type { ResolvedStream } from "../stremio/resolvers";

export type { ResolvedStream as ExtractedStream };

const isDebug = () => process.env.DEBUG === "1";

export async function extractGaystreamStreams(pageUrl: string): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];

  try {
    const html = await fetchPage(pageUrl, { referer: "https://gaystream.pw/" });
    const $ = cheerio.load(html);

    const embedUrls: string[] = [];

    $("div.tabs-wrap button[onclick]").each((_, el) => {
      const onclick = $(el).attr("onclick") || "";
      const srcMatch = onclick.match(/src=(?:&quot;|"|')(.*?)(?:&quot;|"|')/);
      if (srcMatch?.[1]) {
        let src = srcMatch[1];
        if (src.startsWith("//")) src = `https:${src}`;
        embedUrls.push(src);
      }
    });

    if (embedUrls.length === 0) {
      const iframeSrc = $("iframe#ifr").attr("src");
      if (iframeSrc) {
        embedUrls.push(iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc);
      }
    }

    const downloadLink = $("a.video-download").attr("href");
    if (downloadLink) {
      const fullLink = downloadLink.startsWith("//") ? `https:${downloadLink}` : downloadLink;
      streams.push({ name: "Download", url: fullLink, referer: pageUrl });
    }

    if (isDebug()) console.log(`[GayStream] ${embedUrls.length} embeds found on ${pageUrl}`);

    const results = await Promise.allSettled(
      embedUrls.map((url) => resolveEmbedUrl(url, pageUrl))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        streams.push(...result.value);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[GayStream] Page extraction error: ${err.message}`);
  }

  return sortStreamsByQuality(deduplicateStreams(streams));
}
