import type { StremioStream } from "../../shared/schema.js";
import { getCached, setCached } from "./cache.js";
import { resolveMedia, type ResolvedStream } from "./media-resolver.js";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

type ExtractedStream = {
  name: string;
  title?: string;
  quality?: string;
  url?: string;
  referer?: string;
  externalUrl?: string;
};

function toBase64Url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function buildM3u8ProxyUrl(baseUrl: string, url: string, referer: string): string {
  return `${baseUrl}/api/proxy/m3u8?url=${toBase64Url(url)}&ref=${toBase64Url(referer)}`;
}

function buildMp4ProxyUrl(baseUrl: string, url: string, referer: string): string {
  return `${baseUrl}/proxy/stream?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}

async function resolveWithCache(url: string, referer?: string): Promise<ResolvedStream> {
  const cacheKey = `resolved:${url}`;
  const cached = getCached<ResolvedStream>("stream", cacheKey);
  if (cached) return cached;

  const resolved = await resolveMedia(url, referer);
  setCached("stream", cacheKey, resolved);
  return resolved;
}

export async function mapStreamsForStremio(extracted: ExtractedStream[], baseUrl?: string): Promise<StremioStream[]> {
  const RESOLVE_TIMEOUT = 8000;

  const mapped = await Promise.all(extracted.map(async (s): Promise<StremioStream | null> => {
    if (s.externalUrl && !s.url) {
      return {
        name: s.name,
        title: s.title || `${s.name} - Open in Browser`,
        externalUrl: s.externalUrl,
      };
    }

    if (!s.url) return null;

    let resolved: ResolvedStream;
    try {
      resolved = await Promise.race([
        resolveWithCache(s.url, s.referer),
        new Promise<ResolvedStream>((_, reject) =>
          setTimeout(() => reject(new Error("resolve timeout")), RESOLVE_TIMEOUT)
        ),
      ]);
    } catch {
      resolved = { url: s.url, type: s.url.includes(".m3u8") ? "m3u8" : s.url.includes(".mp4") ? "mp4" : "unknown", referer: s.referer };
    }

    const refererForProxy = resolved.referer || s.referer || s.url;
    let finalUrl = resolved.url;
    const hints: Record<string, unknown> = {};

    if (resolved.type === "m3u8" && baseUrl) {
      finalUrl = buildM3u8ProxyUrl(baseUrl, resolved.url, refererForProxy);
      hints.notWebReady = true;
    } else if (resolved.type === "mp4" && baseUrl) {
      finalUrl = buildMp4ProxyUrl(baseUrl, resolved.url, refererForProxy);
      hints.notWebReady = false;
    } else if (resolved.type === "mp4") {
      hints.proxyHeaders = {
        request: {
          Referer: refererForProxy,
          "User-Agent": USER_AGENT,
        },
      };
      hints.notWebReady = true;
    } else {
      hints.notWebReady = false;
    }

    return {
      name: s.name,
      title: s.title || (s.quality ? `${s.name} - ${s.quality}` : s.name),
      url: finalUrl,
      behaviorHints: hints,
    };
  }));

  return mapped.filter((stream): stream is StremioStream => Boolean(stream));
}
