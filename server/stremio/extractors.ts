import { fetchPage } from "./http";
import * as cheerio from "cheerio";

const isDebug = () => process.env.DEBUG === "1";

export interface ExtractedStream {
  name: string;
  url: string;
  quality?: string;
  referer?: string;
}

export async function extractStreams(pageUrl: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];

  try {
    const html = await fetchPage(pageUrl);
    const $ = cheerio.load(html);

    const iframes = $("#video-code iframe");
    for (let i = 0; i < iframes.length; i++) {
      const src = $(iframes[i]).attr("src");
      if (!src) continue;

      if (isDebug()) console.log(`[Extractor] Found iframe src: ${src}`);

      try {
        const extracted = await resolveEmbed(src);
        streams.push(...extracted);
      } catch (err: any) {
        if (isDebug()) console.error(`[Extractor] Failed to resolve ${src}:`, err.message);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Extractor] Failed to load page ${pageUrl}:`, err.message);
  }

  return streams;
}

async function resolveEmbed(embedUrl: string): Promise<ExtractedStream[]> {
  const url = embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl;

  if (url.includes("74k.io")) {
    return extractGXtapes(url);
  }
  if (url.includes("88z.io")) {
    return extractGXtapesNew(url);
  }
  if (url.includes("44x.io")) {
    return extract44x(url);
  }
  if (url.includes("vid.xtapes")) {
    return extractVID(url);
  }
  if (url.includes("dood") || url.includes("doodstream") || url.includes("d0o0d") || url.includes("ds2play")) {
    return extractDoodStream(url);
  }

  return extractGenericIframe(url);
}

async function extractGXtapes(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);

    const evalMatch = html.match(/eval\(function\(p,a,c,k,e,[dr]\).+?\)\)/s);
    if (!evalMatch) {
      if (isDebug()) console.log("[GXtapes] No packed script found");
      return streams;
    }

    const unpacked = unpack(evalMatch[0]);
    if (!unpacked) return streams;

    const linksMatch = unpacked.match(/var links=\{(.+?)\}/);
    if (!linksMatch) return streams;

    try {
      const linksJson = `{${linksMatch[1]}}`;
      const parsed = JSON.parse(linksJson.replace(/'/g, '"'));
      for (const [quality, streamUrl] of Object.entries(parsed)) {
        let finalUrl = streamUrl as string;
        if (!finalUrl.startsWith("http")) {
          const urlObj = new URL(url);
          finalUrl = `${urlObj.protocol}//${urlObj.host}${finalUrl.startsWith("/") ? "" : "/"}${finalUrl}`;
        }
        streams.push({
          name: `GXtapes ${quality}`,
          url: finalUrl,
          quality,
        });
      }
    } catch (e: any) {
      if (isDebug()) console.error("[GXtapes] JSON parse error:", e.message);
    }
  } catch (err: any) {
    if (isDebug()) console.error("[GXtapes] Extraction error:", err.message);
  }
  return streams;
}

async function extractGXtapesNew(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $("#video-code iframe").each((_, iframe) => {
      const src = $(iframe).attr("src");
      if (src) {
        const videoHash = src.split("/").pop();
        if (videoHash) {
          streams.push({
            name: "88z.io",
            url: `https://88z.io/${videoHash}`,
          });
        }
      }
    });

    if (streams.length === 0) {
      const srcMatch = html.match(/src:\s*'([^']+)'/);
      if (srcMatch) {
        streams.push({
          name: "88z.io",
          url: srcMatch[1],
        });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[88z.io] Extraction error:", err.message);
  }
  return streams;
}

async function extract44x(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $("#video-code iframe").each((_, iframe) => {
      const src = $(iframe).attr("src");
      if (src) {
        const videoHash = src.split("/").pop();
        if (videoHash) {
          streams.push({
            name: "44x.io",
            url: `https://vi.44x.io/${videoHash}`,
          });
        }
      }
    });
  } catch (err: any) {
    if (isDebug()) console.error("[44x.io] Extraction error:", err.message);
  }
  return streams;
}

async function extractVID(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);
    const srcMatch = html.match(/src:\s*'([^']+)'/);
    if (srcMatch) {
      streams.push({
        name: "VID Xtapes",
        url: srcMatch[1],
        referer: url,
      });
    }
  } catch (err: any) {
    if (isDebug()) console.error("[VID] Extraction error:", err.message);
  }
  return streams;
}

async function extractDoodStream(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const mainUrl = new URL(url).origin;
    const html = await fetchPage(url);

    const passMd5Match = html.match(/\/pass_md5\/[^'"]*/);
    if (!passMd5Match) return streams;

    const passMd5Path = passMd5Match[0];
    const token = passMd5Path.split("/").pop() || "";
    const slug = url.split("/").pop() || "";

    const md5Url = `${mainUrl}${passMd5Path}`;
    const videoData = await fetchPage(md5Url, {
      referer: `${mainUrl}/${slug}`,
    });

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 10; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalUrl = `${videoData}${randomStr}?token=${token}&expiry=${Date.now()}`;

    const qualityMatch = html.match(/<title>.*?(\d{3,4}p).*?<\/title>/);
    const quality = qualityMatch ? qualityMatch[1] : undefined;

    streams.push({
      name: `DoodStream${quality ? ` ${quality}` : ""}`,
      url: finalUrl,
      quality,
      referer: mainUrl,
    });
  } catch (err: any) {
    if (isDebug()) console.error("[DoodStream] Extraction error:", err.message);
  }
  return streams;
}

async function extractGenericIframe(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);

    const srcMatch = html.match(/src:\s*'([^']+)'/);
    if (srcMatch) {
      streams.push({
        name: new URL(url).hostname,
        url: srcMatch[1],
        referer: url,
      });
      return streams;
    }

    const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/);
    if (fileMatch) {
      streams.push({
        name: new URL(url).hostname,
        url: fileMatch[1],
        referer: url,
      });
    }
  } catch (err: any) {
    if (isDebug()) console.error("[Generic] Extraction error:", err.message);
  }
  return streams;
}

function unpack(packed: string): string | null {
  try {
    const match = packed.match(/eval\(function\(p,a,c,k,e,[dr]\)\{.+?\}\('(.+)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/s);
    if (!match) return null;

    let [, p, a, c, kStr] = match;
    const aNum = parseInt(a);
    const cNum = parseInt(c);
    const k = kStr.split("|");

    function baseN(num: number, base: number): string {
      const digits = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (num < base) return digits[num] || "";
      return baseN(Math.floor(num / base), base) + (digits[num % base] || "");
    }

    let result = p;
    for (let i = cNum - 1; i >= 0; i--) {
      const token = baseN(i, aNum);
      if (k[i]) {
        result = result.replace(new RegExp(`\\b${token}\\b`, "g"), k[i]);
      }
    }
    return result;
  } catch {
    return null;
  }
}
