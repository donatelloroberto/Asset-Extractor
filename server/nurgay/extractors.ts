import { fetchPage } from "../stremio/http";
import * as cheerio from "cheerio";

const isDebug = () => process.env.DEBUG === "1";

export interface ExtractedStream {
  name: string;
  url: string;
  quality?: string;
  referer?: string;
}

const SUPPORTED_HOSTS = [
  "voe.sx", "voe.to", "jilliandescribecompany.com", "markstylecompany.com", "primaryclassaliede.com",
  "doodstream.com", "ds2video.com", "d0o0d.com", "d-s.io", "vide0.net", "myvidplay.com", "dood.",
  "streamtape.com", "tapepops.com",
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
    return SUPPORTED_HOSTS.some(h => hostname.includes(h));
  } catch {
    return false;
  }
}

export async function extractNurgayStreams(pageUrl: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];

  try {
    const html = await fetchPage(pageUrl, { referer: "https://nurgay.to/" });
    const $ = cheerio.load(html);

    const iframeSrc = $(".video-player iframe, .responsive-player iframe").attr("src");
    if (iframeSrc) {
      const fullSrc = iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc;
      if (isDebug()) console.log(`[Nurgay] Found iframe: ${fullSrc}`);
      try {
        const iframeStreams = await resolveEmbed(fullSrc, pageUrl);
        streams.push(...iframeStreams);
      } catch (err: any) {
        if (isDebug()) console.error(`[Nurgay] Iframe extraction failed: ${err.message}`);
      }
    }

    const mirrorUrls = new Set<string>();

    $("ul#mirrorMenu a.mirror-opt, a.dropdown-item.mirror-opt").each((_, el) => {
      const dataUrl = $(el).attr("data-url");
      if (dataUrl && dataUrl !== "#" && dataUrl.trim()) {
        mirrorUrls.add(dataUrl.startsWith("//") ? `https:${dataUrl}` : dataUrl);
      }
    });

    $(".notranslate a[href], .entry-content a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href && isStreamHost(href)) {
        mirrorUrls.add(href);
      }
    });

    if (isDebug()) console.log(`[Nurgay] Found ${mirrorUrls.size} mirror URLs`);

    const embedPromises = Array.from(mirrorUrls).map(async (mirrorUrl) => {
      try {
        const resolved = await resolveEmbed(mirrorUrl, pageUrl);
        return resolved;
      } catch (err: any) {
        if (isDebug()) console.error(`[Nurgay] Mirror ${mirrorUrl} failed: ${err.message}`);
        return [];
      }
    });

    const results = await Promise.allSettled(embedPromises);
    for (const result of results) {
      if (result.status === "fulfilled") {
        streams.push(...result.value);
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Nurgay] Page extraction error: ${err.message}`);
  }

  const unique = new Map<string, ExtractedStream>();
  for (const s of streams) {
    if (!unique.has(s.url)) {
      unique.set(s.url, s);
    }
  }

  return Array.from(unique.values());
}

async function resolveEmbed(embedUrl: string, referer: string): Promise<ExtractedStream[]> {
  const url = embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl;
  const hostname = new URL(url).hostname;

  if (hostname.includes("voe.sx") || hostname.includes("voe.to") || hostname.includes("jilliandescribecompany.com") || hostname.includes("markstylecompany.com") || hostname.includes("primaryclassaliede.com")) {
    return extractVoe(url, referer);
  }
  if (hostname.includes("vinovo")) {
    return extractVoe(url, referer);
  }
  if (hostname.includes("doodstream") || hostname.includes("ds2video") || hostname.includes("d0o0d") || hostname.includes("d-s.io") || hostname.includes("vide0.net") || hostname.includes("dood.") || hostname.includes("myvidplay")) {
    return extractDood(url, referer);
  }
  if (hostname.includes("streamtape") || hostname.includes("tapepops")) {
    return extractStreamtape(url);
  }
  if (hostname.includes("bigwarp") || hostname.includes("bgwp")) {
    return extractBigwarp(url);
  }
  if (hostname.includes("listmirror")) {
    return extractListMirror(url, referer);
  }
  if (hostname.includes("filemoon")) {
    return extractFilemoon(url);
  }
  if (hostname.includes("vidoza")) {
    return extractVidoza(url, referer);
  }

  return extractGeneric(url);
}

async function extractVoe(url: string, referer?: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const hostname = new URL(url).hostname;
    const label = hostname.includes("vinovo") ? "Vinovo" : "Voe";

    const html = await fetchPage(url, { referer: referer || url });

    const sourcesMatch = html.match(/const\s+sources\s*=\s*(\{[^}]+\})/);
    if (sourcesMatch) {
      const hlsMatch = sourcesMatch[1].match(/"hls"\s*:\s*"([^"]+)"/);
      if (hlsMatch) {
        streams.push({
          name: label,
          url: hlsMatch[1],
          referer: url,
        });
      }
    }

    if (streams.length === 0) {
      const hlsFallback = html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/);
      if (hlsFallback) {
        streams.push({
          name: label,
          url: hlsFallback[0],
          referer: url,
        });
      }
    }

    if (streams.length === 0) {
      const mp4Match = html.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/);
      if (mp4Match) {
        streams.push({
          name: label,
          url: mp4Match[0],
          referer: url,
        });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[Voe] Extraction error:", err.message);
  }
  return streams;
}

async function extractDood(url: string, referer?: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const mainUrl = new URL(url).origin;
    const pathParts = new URL(url).pathname.split("/");
    const videoId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

    const embedUrl = url.includes("/e/") ? url : `${mainUrl}/e/${videoId}`;

    const html = await fetchPage(embedUrl, { referer: referer || url });

    const passMd5Match = html.match(/\/pass_md5\/[^'"*/]*/);
    if (!passMd5Match) {
      if (isDebug()) console.error("[Dood] pass_md5 pattern not found");
      return streams;
    }

    const passMd5Path = passMd5Match[0];
    const token = passMd5Path.split("/").pop() || "";

    const md5Url = `${mainUrl}${passMd5Path}`;
    const videoData = await fetchPage(md5Url, { referer: embedUrl });

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 10; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalUrl = `${videoData}${randomStr}?token=${token}&expiry=${Date.now()}`;

    const qualityMatch = html.match(/<title>.*?(\d{3,4})[pP].*?<\/title>/);
    const quality = qualityMatch ? `${qualityMatch[1]}p` : undefined;

    streams.push({
      name: `DoodStream${quality ? ` ${quality}` : ""}`,
      url: finalUrl,
      quality,
      referer: mainUrl,
    });
  } catch (err: any) {
    if (isDebug()) console.error("[Dood] Extraction error:", err.message);
  }
  return streams;
}

async function extractStreamtape(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);

    const tokenMatch = html.match(/document\.getElementById\('(?:robotlink|ideoooolink)'\)\.innerHTML\s*=\s*["'](\/\/[^"']+)["']\s*\+\s*\('([^']+)'\)/);
    if (tokenMatch) {
      const baseUrl = `https:${tokenMatch[1]}`;
      const tokenPart = tokenMatch[2];
      const tokenEndMatch = html.match(new RegExp(`'${tokenPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\)\\s*\\+\\s*'([^']*)'`));
      const fullUrl = baseUrl + tokenPart + (tokenEndMatch ? tokenEndMatch[1] : "");
      streams.push({
        name: "StreamTape",
        url: fullUrl,
        referer: url,
      });
    }

    if (streams.length === 0) {
      const altMatch = html.match(/document\.getElementById\('(?:robotlink|ideoooolink)'\)\.innerHTML\s*=\s*[^+]+\+\s*['"]([^'"]+)['"]/);
      if (altMatch) {
        const partialUrl = altMatch[1];
        if (partialUrl.startsWith("//")) {
          streams.push({
            name: "StreamTape",
            url: `https:${partialUrl}`,
            referer: url,
          });
        }
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[StreamTape] Extraction error:", err.message);
  }
  return streams;
}

async function extractBigwarp(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const response = await fetchPage(url);

    const redirectMatch = response.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
    const targetUrl = redirectMatch ? redirectMatch[1] : url;

    const html = redirectMatch ? await fetchPage(targetUrl) : response;

    const fileMatch = html.match(/file:\s*["']((?:https?:\/\/|\/\/)[^"']+)["']/);
    if (fileMatch) {
      let streamUrl = fileMatch[1];
      if (streamUrl.startsWith("//")) streamUrl = `https:${streamUrl}`;
      streams.push({
        name: "Bigwarp",
        url: streamUrl,
      });
    }

    if (streams.length === 0) {
      const srcMatch = html.match(/src:\s*["']((?:https?:\/\/|\/\/)[^"']+)["']/);
      if (srcMatch) {
        let streamUrl = srcMatch[1];
        if (streamUrl.startsWith("//")) streamUrl = `https:${streamUrl}`;
        streams.push({
          name: "Bigwarp",
          url: streamUrl,
        });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[Bigwarp] Extraction error:", err.message);
  }
  return streams;
}

async function extractVidoza(url: string, referer?: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const sourceMatch = html.match(/sourcesCode\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (sourceMatch) {
      const srcRegex = /src:\s*["']([^"']+)["']/g;
      let m;
      while ((m = srcRegex.exec(sourceMatch[1])) !== null) {
        streams.push({
          name: "Vidoza",
          url: m[1],
          referer: url,
        });
      }
    }

    if (streams.length === 0) {
      const sourceTagRegex = /<source\s+src=["']([^"']+)["'][^>]*>/gi;
      let m;
      while ((m = sourceTagRegex.exec(html)) !== null) {
        if (m[1].includes(".mp4") || m[1].includes(".m3u8")) {
          streams.push({
            name: "Vidoza",
            url: m[1],
            referer: url,
          });
        }
      }
    }

    if (streams.length === 0) {
      const fileMatch = html.match(/file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/);
      if (fileMatch) {
        streams.push({
          name: "Vidoza",
          url: fileMatch[1],
          referer: url,
        });
      }
    }

    if (streams.length === 0) {
      const mp4Match = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/);
      if (mp4Match) {
        streams.push({
          name: "Vidoza",
          url: mp4Match[0],
          referer: url,
        });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[Vidoza] Extraction error:", err.message);
  }
  return streams;
}

async function extractListMirror(url: string, referer: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || "https://nurgay.to/" });
    const $ = cheerio.load(html);

    const mirrorUrls: string[] = [];
    $("a.mirror-opt, .dropdown-item.mirror-opt").each((_, el) => {
      const dataUrl = $(el).attr("data-url");
      if (dataUrl && dataUrl !== "#" && dataUrl.trim()) {
        mirrorUrls.push(dataUrl.startsWith("//") ? `https:${dataUrl}` : dataUrl);
      }
    });

    if (mirrorUrls.length > 0) {
      if (isDebug()) console.log(`[ListMirror] Found ${mirrorUrls.length} mirrors from dropdown:`, mirrorUrls);
      const embedPromises = mirrorUrls.map(async (mirrorUrl) => {
        try {
          return await resolveEmbed(mirrorUrl, referer);
        } catch (err: any) {
          if (isDebug()) console.error(`[ListMirror] Mirror ${mirrorUrl} failed: ${err.message}`);
          return [];
        }
      });
      const results = await Promise.allSettled(embedPromises);
      for (const result of results) {
        if (result.status === "fulfilled") {
          streams.push(...result.value);
        }
      }
    }

    if (streams.length === 0) {
      const sourcesMatch = html.match(/(?:const\s+)?sources\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (sourcesMatch) {
        if (isDebug()) console.log(`[ListMirror] Found sources JS array`);
        const jsonStr = sourcesMatch[1].replace(/'/g, '"');
        try {
          const sources = JSON.parse(jsonStr);
          for (const source of sources) {
            if (source.url) {
              try {
                const resolved = await resolveEmbed(source.url, referer);
                streams.push(...resolved);
              } catch {}
            }
          }
        } catch {
          const urlRegex = /"url"\s*:\s*"([^"]+)"/g;
          let m;
          while ((m = urlRegex.exec(sourcesMatch[1])) !== null) {
            try {
              const resolved = await resolveEmbed(m[1], referer);
              streams.push(...resolved);
            } catch {}
          }
        }
      }
    }

    if (streams.length === 0) {
      const iframeSrc = $("iframe.mirror-iframe, iframe").attr("src");
      if (iframeSrc && iframeSrc !== url) {
        const fullSrc = iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc;
        try {
          const resolved = await resolveEmbed(fullSrc, referer);
          streams.push(...resolved);
        } catch {}
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[ListMirror] Extraction error:", err.message);
  }
  return streams;
}

async function extractFilemoon(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);

    const evalBlock = findEvalBlock(html);
    if (evalBlock) {
      const unpacked = unpack(evalBlock);
      if (unpacked) {
        const hlsUrls = unpacked.match(/https?:\/\/[^\s"'\\}]+\.m3u8[^\s"'\\}]*/g);
        if (hlsUrls) {
          for (const hlsUrl of hlsUrls) {
            streams.push({
              name: "FileMoon",
              url: hlsUrl,
              referer: url,
            });
          }
        }
        if (streams.length === 0) {
          const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+)["']/);
          if (fileMatch) {
            streams.push({
              name: "FileMoon",
              url: fileMatch[1],
              referer: url,
            });
          }
        }
      }
    }

    if (streams.length === 0) {
      const srcMatch = html.match(/file\s*:\s*["'](https?:\/\/[^"']+)["']/);
      if (srcMatch) {
        streams.push({
          name: "FileMoon",
          url: srcMatch[1],
          referer: url,
        });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error("[FileMoon] Extraction error:", err.message);
  }
  return streams;
}

async function extractGeneric(url: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];
  try {
    const html = await fetchPage(url);
    const hostname = new URL(url).hostname;

    const fileMatch = html.match(/file\s*:\s*["'](https?:\/\/[^"']+)["']/);
    if (fileMatch) {
      streams.push({
        name: hostname,
        url: fileMatch[1],
        referer: url,
      });
      return streams;
    }

    const srcMatch = html.match(/src:\s*["'](https?:\/\/[^"']+)["']/);
    if (srcMatch) {
      streams.push({
        name: hostname,
        url: srcMatch[1],
        referer: url,
      });
    }
  } catch (err: any) {
    if (isDebug()) console.error("[Generic] Extraction error:", err.message);
  }
  return streams;
}

function findEvalBlock(html: string): string | null {
  const evalStart = html.indexOf("eval(function(p,a,c,k,e,d)");
  if (evalStart === -1) {
    const altStart = html.indexOf("eval(function(p,a,c,k,e,r)");
    if (altStart === -1) return null;
    return findEvalBlockFrom(html, altStart);
  }
  return findEvalBlockFrom(html, evalStart);
}

function findEvalBlockFrom(html: string, evalStart: number): string | null {
  let depth = 0;
  for (let i = evalStart; i < html.length; i++) {
    if (html[i] === "(") depth++;
    if (html[i] === ")") {
      depth--;
      if (depth === 0) {
        return html.substring(evalStart, i + 1);
      }
    }
  }
  return null;
}

function unpack(packed: string): string | null {
  try {
    const bodyEnd = packed.indexOf("return p}(");
    if (bodyEnd === -1) return null;

    const argsStr = packed.substring(bodyEnd + "return p}(".length);

    let inStr = false;
    let strStart = -1;
    let strEnd = -1;
    for (let i = 0; i < argsStr.length; i++) {
      if (argsStr[i] === "'" && (i === 0 || argsStr[i - 1] !== "\\")) {
        if (!inStr) {
          inStr = true;
          strStart = i + 1;
        } else {
          strEnd = i;
          break;
        }
      }
    }

    if (strEnd <= 0) return null;

    const p = argsStr.substring(strStart, strEnd);
    const rest = argsStr.substring(strEnd + 1);

    const partsMatch = rest.match(/^\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']*)'\s*\.split\(\s*'([^']*)'\s*\)/);
    if (!partsMatch) return null;

    const a = parseInt(partsMatch[1]);
    const c = parseInt(partsMatch[2]);
    const k = partsMatch[3].split(partsMatch[4]);

    let result = p;
    for (let i = c - 1; i >= 0; i--) {
      if (k[i]) {
        const token = i.toString(a);
        result = result.replace(new RegExp(`\\b${token}\\b`, "g"), k[i]);
      }
    }
    return result;
  } catch {
    return null;
  }
}
