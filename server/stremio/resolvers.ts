import { fetchPage } from "./http";
import { extractStreamtapeUrl } from "./streamtape";

const isDebug = () => process.env.DEBUG === "1";

export interface ResolvedStream {
  name: string;
  url?: string;
  externalUrl?: string;
  quality?: string;
  referer?: string;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
    };
  };
}

export type FailReason =
  | "no_pass_md5"
  | "no_hls"
  | "no_mp4"
  | "unpack_failed"
  | "no_pattern"
  | "fetch_error"
  | "unknown";

export interface ResolveResult {
  streams: ResolvedStream[];
  failReason?: FailReason;
}

function isVoeHost(hostname: string): boolean {
  return (
    hostname.includes("voe.sx") ||
    hostname.includes("voe.to") ||
    hostname.includes("jilliandescribecompany") ||
    hostname.includes("markstylecompany") ||
    hostname.includes("primaryclassaliede") ||
    hostname.includes("vinovo.si") ||
    hostname.includes("vinovo.to")
  );
}

function isDoodHost(hostname: string): boolean {
  return (
    hostname.includes("doodstream") ||
    hostname.includes("ds2video") ||
    hostname.includes("d0o0d") ||
    hostname.includes("dsvplay") ||
    hostname.includes("vide0.net") ||
    hostname.includes("myvidplay") ||
    hostname.includes("dood.") ||
    hostname.includes("d-s.io")
  );
}

function isStreamtapeHost(hostname: string): boolean {
  return hostname.includes("streamtape") || hostname.includes("tapepops");
}

function isFilemoonHost(hostname: string): boolean {
  return hostname.includes("filemoon");
}

function isMixdropHost(hostname: string): boolean {
  return hostname.includes("mixdrop");
}

function isBigwarpHost(hostname: string): boolean {
  return hostname.includes("bigwarp") || hostname.includes("bgwp");
}

function isVidozaHost(hostname: string): boolean {
  return hostname.includes("vidoza");
}

function isListmirrorHost(hostname: string): boolean {
  return hostname.includes("listmirror");
}

export function getHostLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (isVoeHost(hostname)) return "VOE";
    if (isDoodHost(hostname)) return "DoodStream";
    if (isStreamtapeHost(hostname)) return "StreamTape";
    if (isFilemoonHost(hostname)) return "FileMoon";
    if (isMixdropHost(hostname)) return "MixDrop";
    if (isBigwarpHost(hostname)) return "Bigwarp";
    if (isVidozaHost(hostname)) return "Vidoza";
    return hostname;
  } catch {
    return "Unknown";
  }
}

export async function resolveEmbedUrl(
  embedUrl: string,
  referer: string
): Promise<ResolvedStream[]> {
  const url = embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl;

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }

  try {
    if (isVoeHost(hostname)) return await resolveVoe(url, referer);
    if (isDoodHost(hostname)) return await resolveDood(url, referer);
    if (isStreamtapeHost(hostname)) return await resolveStreamtape(url);
    if (isFilemoonHost(hostname)) return await resolveFilemoon(url, referer);
    if (isMixdropHost(hostname)) return await resolveMixdrop(url, referer);
    if (isBigwarpHost(hostname)) return await resolveBigwarp(url, referer);
    if (isVidozaHost(hostname)) return await resolveVidoza(url, referer);
    if (isListmirrorHost(hostname)) return await resolveListmirror(url, referer);
    return await resolveGeneric(url, referer);
  } catch (err: any) {
    if (isDebug())
      console.error(`[Resolvers] resolveEmbedUrl failed for ${url}: ${err.message}`);
    return [];
  }
}

export async function resolveVoe(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const label = new URL(url).hostname.includes("vinovo") ? "Vinovo" : "VOE";
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const atobMatch = html.match(/sources\s*=\s*JSON\.parse\(atob\(['"]([A-Za-z0-9+/=]+)['"]\)\)/);
    if (atobMatch) {
      try {
        const decoded = Buffer.from(atobMatch[1], "base64").toString("utf-8");
        const obj = JSON.parse(decoded);
        const hls = obj.hls || obj.hlsAuto;
        if (hls) {
          streams.push({ name: label, url: hls, referer: url });
          return streams;
        }
      } catch {}
    }

    const sourcesPatterns = [
      /const\s+sources\s*=\s*(\{[\s\S]*?\})\s*;/,
      /var\s+sources\s*=\s*(\{[\s\S]*?\})\s*;/,
      /sources\s*=\s*(\{[\s\S]*?\})\s*[;,]/,
    ];
    for (const pat of sourcesPatterns) {
      const m = html.match(pat);
      if (m) {
        const hlsMatch = m[1].match(/"hls"\s*:\s*"([^"]+)"/);
        if (hlsMatch) {
          streams.push({ name: label, url: hlsMatch[1], referer: url });
          return streams;
        }
        const mp4Match = m[1].match(/"mp4"\s*:\s*"([^"]+)"/);
        if (mp4Match) {
          streams.push({ name: label, url: mp4Match[0], referer: url });
          return streams;
        }
      }
    }

    const hlsFallback = html.match(/https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/);
    if (hlsFallback) {
      streams.push({ name: label, url: hlsFallback[0], referer: url });
      return streams;
    }

    const mp4Fallback = html.match(/https?:\/\/[^\s"'<>\\]+\.mp4[^\s"'<>\\]*/);
    if (mp4Fallback) {
      streams.push({ name: label, url: mp4Fallback[0], referer: url });
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[VOE] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveDood(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const origin = new URL(url).origin;
    const pathParts = new URL(url).pathname.split("/").filter(Boolean);
    const videoId = pathParts[pathParts.length - 1] || "";

    const embedUrl =
      url.includes("/e/") || url.includes("/embed/")
        ? url
        : `${origin}/e/${videoId}`;

    const html = await fetchPage(embedUrl, { referer: referer || origin });

    const passMd5Match = html.match(/\/pass_md5\/[^'"*/ \n]*/);
    if (!passMd5Match) {
      if (isDebug()) console.error("[DoodStream] pass_md5 not found");
      return streams;
    }

    const passMd5Path = passMd5Match[0].trim();
    const token = passMd5Path.split("/").pop() || "";

    const md5Url = `${origin}${passMd5Path}`;
    const rawBase = await fetchPage(md5Url, { referer: embedUrl });
    const videoBase = rawBase.trim();

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 10; i++) {
      randomStr += chars[Math.floor(Math.random() * chars.length)];
    }

    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const finalUrl = `${videoBase}${randomStr}?token=${token}&expiry=${expiry}`;

    const qualityMatch = html.match(/<title>[^<]*?(\d{3,4})[pP][^<]*?<\/title>/);
    const quality = qualityMatch ? `${qualityMatch[1]}p` : undefined;

    streams.push({
      name: `DoodStream${quality ? ` ${quality}` : ""}`,
      url: finalUrl,
      quality,
      referer: origin,
      behaviorHints: {
        notWebReady: false,
        proxyHeaders: { request: { Referer: origin } },
      },
    });
  } catch (err: any) {
    if (isDebug()) console.error(`[DoodStream] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveStreamtape(url: string): Promise<ResolvedStream[]> {
  const results = await extractStreamtapeUrl(url);
  return results.map((r) => ({
    name: r.name,
    url: r.url,
    externalUrl: r.externalUrl,
    referer: r.referer,
    behaviorHints: r.url ? { notWebReady: false } : undefined,
  }));
}

export async function resolveFilemoon(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const evalBlock = findEvalBlock(html);
    if (evalBlock) {
      const unpacked = unpack(evalBlock);
      if (unpacked) {
        const hlsUrls = unpacked.match(
          /https?:\/\/[^\s"'\\}]+\.m3u8[^\s"'\\}]*/g
        );
        if (hlsUrls) {
          const seen = new Set<string>();
          for (const hlsUrl of hlsUrls) {
            if (!seen.has(hlsUrl)) {
              seen.add(hlsUrl);
              streams.push({ name: "FileMoon", url: hlsUrl, referer: url });
            }
          }
          if (streams.length > 0) return streams;
        }
        const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+)["']/);
        if (fileMatch) {
          streams.push({ name: "FileMoon", url: fileMatch[1], referer: url });
          return streams;
        }
      }
    }

    const directFileMatch = html.match(
      /file\s*:\s*["'](https?:\/\/[^"']+)["']/
    );
    if (directFileMatch) {
      streams.push({ name: "FileMoon", url: directFileMatch[1], referer: url });
      return streams;
    }

    const jwSetupMatch = html.match(/jwplayer\([^)]+\)\.setup\(\{([\s\S]*?)\}\)/);
    if (jwSetupMatch) {
      const hlsM = jwSetupMatch[1].match(/"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/);
      if (hlsM) {
        streams.push({ name: "FileMoon", url: hlsM[1], referer: url });
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[FileMoon] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveMixdrop(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const evalBlock = findEvalBlock(html);
    if (evalBlock) {
      const unpacked = unpack(evalBlock);
      if (unpacked) {
        const wdoMatch = unpacked.match(/wdo\s*=\s*["']([^"']+)["']/);
        if (wdoMatch) {
          let videoUrl = wdoMatch[1];
          if (videoUrl.startsWith("//")) videoUrl = `https:${videoUrl}`;
          streams.push({ name: "MixDrop", url: videoUrl, referer: url });
          return streams;
        }
      }
    }

    const wdoPattern = /MDCore\.wdo\s*=\s*["']([^"']+)["']/;
    const wdoMatch = html.match(wdoPattern);
    if (wdoMatch) {
      let videoUrl = wdoMatch[1];
      if (videoUrl.startsWith("//")) videoUrl = `https:${videoUrl}`;
      streams.push({ name: "MixDrop", url: videoUrl, referer: url });
      return streams;
    }

    const srcMatch = html.match(/src\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/);
    if (srcMatch) {
      streams.push({ name: "MixDrop", url: srcMatch[1], referer: url });
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[MixDrop] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveBigwarp(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const redirectMatch = html.match(
      /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/
    );
    const finalHtml = redirectMatch
      ? await fetchPage(
          redirectMatch[1].startsWith("//")
            ? `https:${redirectMatch[1]}`
            : redirectMatch[1]
        )
      : html;

    const patterns = [
      /file\s*:\s*["'](https?:\/\/[^"']+)["']/,
      /src\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/,
    ];
    for (const pat of patterns) {
      const m = finalHtml.match(pat);
      if (m) {
        let streamUrl = m[1];
        if (streamUrl.startsWith("//")) streamUrl = `https:${streamUrl}`;
        streams.push({ name: "Bigwarp", url: streamUrl, referer: url });
        return streams;
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Bigwarp] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveVidoza(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });

    const sourceMatch = html.match(/sourcesCode\s*[:=]\s*(\[[\s\S]*?\])\s*[;,]/);
    if (sourceMatch) {
      const srcRegex = /src\s*:\s*["']([^"']+)["']/g;
      const resRegex = /res\s*:\s*["']?(\d+)["']?/g;
      const srcs: string[] = [];
      const ress: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = srcRegex.exec(sourceMatch[1])) !== null) srcs.push(m[1]);
      while ((m = resRegex.exec(sourceMatch[1])) !== null) ress.push(m[1]);
      for (let i = 0; i < srcs.length; i++) {
        const quality = ress[i] ? `${ress[i]}p` : undefined;
        streams.push({
          name: `Vidoza${quality ? ` ${quality}` : ""}`,
          url: srcs[i],
          quality,
          referer: "https://vidoza.net/",
        });
      }
      if (streams.length > 0) return streams;
    }

    const sourceTagRegex = /<source\s+src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = sourceTagRegex.exec(html)) !== null) {
      if (/\.(mp4|m3u8)/.test(m[1])) {
        streams.push({ name: "Vidoza", url: m[1], referer: "https://vidoza.net/" });
      }
    }
    if (streams.length > 0) return streams;

    const fileMatch = html.match(
      /file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/
    );
    if (fileMatch) {
      streams.push({ name: "Vidoza", url: fileMatch[1], referer: "https://vidoza.net/" });
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Vidoza] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveListmirror(
  url: string,
  referer: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer });
    const { load } = await import("cheerio");
    const $ = load(html);

    const embedUrls: string[] = [];

    $("a.mirror-opt, .dropdown-item.mirror-opt").each((_, el) => {
      const dataUrl = $(el).attr("data-url");
      if (dataUrl && dataUrl !== "#") {
        embedUrls.push(dataUrl.startsWith("//") ? `https:${dataUrl}` : dataUrl);
      }
    });

    if (embedUrls.length === 0) {
      const iframeSrc = $("iframe.mirror-iframe, iframe").attr("src");
      if (iframeSrc && iframeSrc !== url) {
        embedUrls.push(iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc);
      }
    }

    if (embedUrls.length === 0) {
      const sourcesMatch = html.match(/sources\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (sourcesMatch) {
        const urlRegex = /"url"\s*:\s*"([^"]+)"/g;
        let m: RegExpExecArray | null;
        while ((m = urlRegex.exec(sourcesMatch[1])) !== null) {
          embedUrls.push(m[1]);
        }
      }
    }

    for (const embedUrl of embedUrls) {
      try {
        const resolved = await resolveEmbedUrl(embedUrl, url);
        streams.push(...resolved);
      } catch {}
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[ListMirror] Error: ${err.message}`);
  }
  return streams;
}

export async function resolveGeneric(
  url: string,
  referer?: string
): Promise<ResolvedStream[]> {
  const streams: ResolvedStream[] = [];
  try {
    const html = await fetchPage(url, { referer: referer || url });
    const hostname = new URL(url).hostname;

    const evalBlock = findEvalBlock(html);
    if (evalBlock) {
      const unpacked = unpack(evalBlock);
      if (unpacked) {
        const hlsUrls = unpacked.match(
          /https?:\/\/[^\s"'\\}]+\.m3u8[^\s"'\\}]*/g
        );
        if (hlsUrls?.[0]) {
          streams.push({ name: hostname, url: hlsUrls[0], referer: url });
          return streams;
        }
        const mp4Urls = unpacked.match(
          /https?:\/\/[^\s"'\\}]+\.mp4[^\s"'\\}]*/g
        );
        if (mp4Urls?.[0]) {
          streams.push({ name: hostname, url: mp4Urls[0], referer: url });
          return streams;
        }
      }
    }

    const patterns = [
      /file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/,
      /src\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/,
      /"(https?:\/\/[^"]+\.(?:mp4|m3u8)[^"]*)"/,
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) {
        streams.push({ name: hostname, url: m[1], referer: url });
        return streams;
      }
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[Generic] Error for ${url}: ${err.message}`);
  }
  return streams;
}

export function deduplicateStreams(streams: ResolvedStream[]): ResolvedStream[] {
  const seen = new Set<string>();
  return streams.filter((s) => {
    const key = s.url || s.externalUrl || s.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findEvalBlock(html: string): string | null {
  const variants = [
    "eval(function(p,a,c,k,e,d)",
    "eval(function(p,a,c,k,e,r)",
    "eval(function(h,u,n,t,e,r)",
  ];
  for (const variant of variants) {
    const start = html.indexOf(variant);
    if (start !== -1) {
      return findEvalBlockFrom(html, start);
    }
  }
  return null;
}

function findEvalBlockFrom(html: string, evalStart: number): string | null {
  let depth = 0;
  for (let i = evalStart; i < html.length; i++) {
    if (html[i] === "(") depth++;
    if (html[i] === ")") {
      depth--;
      if (depth === 0) return html.substring(evalStart, i + 1);
    }
  }
  return null;
}

export function unpack(packed: string): string | null {
  try {
    const bodyEnd = packed.indexOf("return p}(");
    if (bodyEnd === -1) return null;

    const argsStr = packed.substring(bodyEnd + "return p}(".length);

    let inStr = false;
    let strStart = -1;
    let strEnd = -1;
    let quote = "";
    for (let i = 0; i < argsStr.length; i++) {
      const ch = argsStr[i];
      if (!inStr && (ch === "'" || ch === '"')) {
        inStr = true;
        quote = ch;
        strStart = i + 1;
      } else if (inStr && ch === quote && argsStr[i - 1] !== "\\") {
        strEnd = i;
        break;
      }
    }

    if (strEnd <= 0) return null;

    const p = argsStr.substring(strStart, strEnd);
    const rest = argsStr.substring(strEnd + 1);

    const partsMatch = rest.match(
      /^\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]*)['"]\.split\(['"]([^'"]*)['"]\)/
    );
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
