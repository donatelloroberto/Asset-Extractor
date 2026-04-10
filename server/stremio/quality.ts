import type { ResolvedStream } from "./resolvers.js";

const QUALITY_ORDER: Record<string, number> = {
  "2160p": 100,
  "4k": 100,
  "1080p": 80,
  "1080": 80,
  "720p": 60,
  "720": 60,
  "480p": 40,
  "480": 40,
  "360p": 20,
  "360": 20,
  "240p": 10,
  "240": 10,
};

const HOST_QUALITY: Record<string, number> = {
  VOE: 70,
  Vinovo: 65,
  FileMoon: 60,
  Vidoza: 55,
  Bigwarp: 50,
  DoodStream: 40,
  StreamTape: 35,
  MixDrop: 30,
};

export function parseQuality(name: string, quality?: string): number {
  const target = (quality || name || "").toLowerCase();

  for (const [label, score] of Object.entries(QUALITY_ORDER)) {
    if (target.includes(label)) return score;
  }

  if (/\b(\d{3,4})p?\b/.test(target)) {
    const res = parseInt(target.match(/\b(\d{3,4})p?\b/)![1]);
    if (res >= 2160) return 100;
    if (res >= 1080) return 80;
    if (res >= 720) return 60;
    if (res >= 480) return 40;
    if (res >= 360) return 20;
    return 10;
  }

  if (target.includes("hls") || target.includes("m3u8")) return 65;

  for (const [host, score] of Object.entries(HOST_QUALITY)) {
    if (target.includes(host.toLowerCase())) return score;
  }

  return 25;
}

export function sortStreamsByQuality(streams: ResolvedStream[]): ResolvedStream[] {
  return [...streams].sort((a, b) => {
    const aIsPlayable = a.url ? 1 : 0;
    const bIsPlayable = b.url ? 1 : 0;
    if (aIsPlayable !== bIsPlayable) return bIsPlayable - aIsPlayable;

    const aScore = parseQuality(a.name, a.quality);
    const bScore = parseQuality(b.name, b.quality);
    return bScore - aScore;
  });
}

export function buildStreamName(
  host: string,
  quality?: string,
  url?: string
): string {
  const qualityTag = quality || inferQualityFromUrl(url);
  if (qualityTag) return `${host} [${qualityTag}]`;
  return host;
}

function inferQualityFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/[/_](\d{3,4})[pP]/);
  if (m) return `${m[1]}p`;
  if (url.includes(".m3u8")) return "HLS";
  return undefined;
}
