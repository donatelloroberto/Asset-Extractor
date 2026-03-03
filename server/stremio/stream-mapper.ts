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

async function resolveWithCache(url: string, referer?: string): Promise<ResolvedStream> {
  const cacheKey = `resolved:${url}`;
  const cached = getCached<ResolvedStream>("stream", cacheKey);
  if (cached) return cached;

  const resolved = await resolveMedia(url, referer);
  setCached("stream", cacheKey, resolved);
  return resolved;
}

export async function mapStreamsForStremio(extracted: ExtractedStream[], baseUrl?: string): Promise<StremioStream[]> {
  const mapped = await Promise.all(extracted.map(async (s): Promise<StremioStream | null> => {
    if (s.externalUrl && !s.url) {
      return {
        name: s.name,
        title: s.title || `${s.name} - Open in Browser`,
        externalUrl: s.externalUrl,
      };
    }

    if (!s.url) return null;

    const resolved = await resolveWithCache(s.url, s.referer);
    const hints: Record<string, unknown> = { notWebReady: false };
    let finalUrl = resolved.url;

    if (resolved.type === "m3u8" && baseUrl) {
      finalUrl = buildM3u8ProxyUrl(baseUrl, resolved.url, resolved.referer || s.referer || "");
    } else if (resolved.type === "mp4") {
      hints.proxyHeaders = {
        request: {
          Referer: resolved.referer || s.referer || s.url,
          "User-Agent": USER_AGENT,
        },
      };
      hints.notWebReady = true;
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
