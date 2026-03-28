import { fetchPage } from "./http";

const isDebug = () => process.env.DEBUG === "1";

export interface StreamtapeResult {
  name: string;
  url?: string;
  externalUrl?: string;
  referer?: string;
}

export async function extractStreamtapeUrl(embedUrl: string): Promise<StreamtapeResult[]> {
  const streams: StreamtapeResult[] = [];

  try {
    const html = await fetchPage(embedUrl, {
      headers: {
        Referer: embedUrl,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (isDebug()) console.log(`[StreamTape] Fetched ${embedUrl}, HTML length: ${html.length}`);

    const videoUrl = resolveStreamtapeUrl(html, embedUrl);
    if (videoUrl) {
      if (isDebug()) console.log(`[StreamTape] Extracted URL: ${videoUrl}`);
      streams.push({ name: "StreamTape", url: videoUrl, referer: embedUrl });
      return streams;
    }

    if (isDebug()) console.log(`[StreamTape] All patterns failed for ${embedUrl}`);
  } catch (err: any) {
    if (isDebug()) console.error(`[StreamTape] Error: ${err.message}`);
  }

  return streams;
}

function resolveStreamtapeUrl(html: string, pageUrl: string): string | null {
  const origin = new URL(pageUrl).origin;

  // Pattern 1: Classic innerHTML with getElementById and string concat
  // document.getElementById('robotlink').innerHTML = "//streamtape.com/get_video?..." + ("token")
  const pat1 = html.match(
    /getElementById\(['"](?:robotlink|ideoooolink)['"]\)\s*\.innerHTML\s*=\s*["'](\/\/[^"']+)["']\s*\+\s*\(['"]([^'"]*)['"]\)/
  );
  if (pat1) {
    const url = `https:${pat1[1]}${pat1[2]}`;
    if (url.includes("get_video") || url.includes("/e/") || url.includes(".mp4")) return url;
  }

  // Pattern 2: innerHTML with variable.innerHTML and string concat
  const pat2 = html.match(
    /\w+\.innerHTML\s*=\s*["'](\/\/(?:streamtape|tapepops)[^"']+)["']\s*\+\s*["']([^'"]*)['"]/
  );
  if (pat2) {
    const url = `https:${pat2[1]}${pat2[2]}`;
    if (url.includes("get_video") || url.includes(".mp4")) return url;
  }

  // Pattern 3: innerHTML with substr anti-scraping
  // ... = "//streamtape.com/get_video?..." + ("longertoken").substr(N)
  const pat3 = html.match(
    /innerHTML\s*=\s*["'](\/\/(?:streamtape|tapepops)[^"']+)["']\s*\+\s*\(['"]([^'"]+)['"]\)\.substr\((\d+)\)/
  );
  if (pat3) {
    const base = `https:${pat3[1]}`;
    const tokenFull = pat3[2];
    const substrStart = parseInt(pat3[3], 10);
    const url = base + tokenFull.substring(substrStart);
    if (url.includes("get_video") || url.includes(".mp4")) return url;
  }

  // Pattern 4: Multi-part innerHTML - base + (token).substr(N) + suffix
  const pat4 = html.match(
    /innerHTML\s*=\s*["'](\/\/(?:streamtape|tapepops)[^"']+)["']\s*\+\s*\(['"]([^'"]+)['"]\)\.substr\((\d+)\)\s*\+\s*["']([^'"]*)['"]/
  );
  if (pat4) {
    const base = `https:${pat4[1]}`;
    const tokenFull = pat4[2];
    const substrStart = parseInt(pat4[3], 10);
    const suffix = pat4[4];
    const url = base + tokenFull.substring(substrStart) + suffix;
    if (url.includes("get_video") || url.includes(".mp4")) return url;
  }

  // Pattern 5: Direct full URL in innerHTML (no concat)
  const pat5 = html.match(
    /innerHTML\s*=\s*["'](https?:\/\/(?:streamtape|tapepops)[^"']+\.mp4[^"']*)["']/
  );
  if (pat5) return pat5[1];

  // Pattern 6: Look for "//streamtape.com/get_video?id=..." URL fragments anywhere
  const pat6 = html.match(/(\/\/(?:streamtape|tapepops)\.[a-z]+\/get_video\?[^"'\s<>\\]+)/);
  if (pat6) {
    const url = `https:${pat6[1]}`;
    if (!url.includes("undefined") && url.includes("token=")) return url;
  }

  // Pattern 7: Look for full https streamtape URL
  const pat7 = html.match(/(https?:\/\/(?:streamtape|tapepops)\.[a-z]+\/get_video\?[^"'\s<>\\]+)/);
  if (pat7 && pat7[1].includes("token=")) return pat7[1];

  // Pattern 8: Loose innerHTML - any two-part concat starting with //streamtape
  const pat8 = html.match(
    /=\s*["'](\/\/(?:streamtape|tapepops)\.[^"']+)["'][^+]*\+[^"']*["']([^"']{5,})['"]/
  );
  if (pat8) {
    const url = `https:${pat8[1]}${pat8[2]}`;
    if (url.includes("token=") || url.includes("get_video")) return url;
  }

  // Pattern 9: video src attribute containing streamtape domain
  const pat9 = html.match(/src=["'](https?:\/\/(?:streamtape|tapepops)\.[^"']+\.mp4[^"']*)["']/);
  if (pat9) return pat9[1];

  // Pattern 10: Obfuscated - look for the token by finding the two consecutive JS strings
  // that form a streamtape URL when concatenated
  const scriptBlocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const block of scriptBlocks) {
    if (!block.includes("streamtape") && !block.includes("tapepops") && !block.includes("robotlink")) continue;

    // Find all string literals in this script block
    const strings: string[] = [];
    const strRegex = /["']([^"']{10,})["']/g;
    let strM: RegExpExecArray | null;
    while ((strM = strRegex.exec(block)) !== null) {
      strings.push(strM[1]);
    }

    // Look for pairs of strings that form a streamtape URL
    for (let i = 0; i < strings.length - 1; i++) {
      const combined = strings[i] + strings[i + 1];
      if (combined.includes("streamtape") && combined.includes("token=") && combined.startsWith("//")) {
        return `https:${combined}`;
      }
      if (combined.startsWith("//streamtape") || combined.startsWith("//tapepops")) {
        const clean = combined.split('"')[0].split("'")[0];
        if (clean.includes("get_video") || clean.includes("token=")) {
          return `https:${clean}`;
        }
      }
    }
  }

  return null;
}
