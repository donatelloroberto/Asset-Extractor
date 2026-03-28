import { fetchPage } from "../stremio/http";

const isDebug = () => process.env.DEBUG === "1";

export interface ExtractedStream {
  name: string;
  url?: string;
  externalUrl?: string;
  quality?: string;
  referer?: string;
}

const QUALITY_LABELS: Record<string, string> = {
  "1280x720": "720p",
  "1920x1080": "1080p",
  "854x480": "480p",
  "640x480": "480p",
  "426x240": "240p",
};

export async function extractBoyfriendtvStreams(pageUrl: string): Promise<ExtractedStream[]> {
  const streams: ExtractedStream[] = [];

  try {
    const html = await fetchPage(pageUrl, { referer: "https://www.boyfriendtv.com/" });

    const sourcesMatch = html.match(/sources\s*:\s*(\{[^}]+\})/);
    if (sourcesMatch) {
      try {
        const rawJson = sourcesMatch[1].replace(/\\\/\//g, "//").replace(/\\\//g, "/");
        const sourcesObj = JSON.parse(rawJson);

        if (sourcesObj.hlsAuto) {
          const templateUrl = sourcesObj.hlsAuto as string;

          const multiMatch = templateUrl.match(/multi=([^\/]+)/);
          if (multiMatch) {
            const multiParts = multiMatch[1].split(",");
            const baseUrl = templateUrl.replace(/_TPL_\.mp4$/, "");

            for (const part of multiParts) {
              const colonIdx = part.indexOf(":");
              if (colonIdx === -1) continue;
              const resolution = part.slice(0, colonIdx);
              const fileId = part.slice(colonIdx + 1);
              const qualityLabel = QUALITY_LABELS[resolution] || resolution;

              streams.push({
                name: `BoyfriendTV [${qualityLabel}]`,
                url: `${baseUrl}${fileId}.mp4`,
                quality: qualityLabel,
                referer: "https://www.boyfriendtv.com/",
              });
            }
          } else {
            streams.push({
              name: "BoyfriendTV HLS",
              url: templateUrl,
              referer: "https://www.boyfriendtv.com/",
            });
          }
        }

        if (sourcesObj.mp4 || sourcesObj.hd) {
          const mp4Url = sourcesObj.hd || sourcesObj.mp4;
          streams.push({
            name: "BoyfriendTV [MP4]",
            url: mp4Url,
            referer: "https://www.boyfriendtv.com/",
          });
        }
      } catch (parseErr: any) {
        if (isDebug()) console.error(`[BoyfriendTV] JSON parse error: ${parseErr.message}`);
      }
    }

    if (streams.length === 0) {
      const mp4Match = html.match(/"(https?:\/\/cdn[^"]*\.mp4[^"]*)"/);
      if (mp4Match) {
        streams.push({
          name: "BoyfriendTV [MP4]",
          url: mp4Match[1].replace(/\\\//g, "/"),
          referer: "https://www.boyfriendtv.com/",
        });
      }
    }

    if (streams.length === 0) {
      if (isDebug()) console.log(`[BoyfriendTV] No sources found on ${pageUrl}`);
    }
  } catch (err: any) {
    if (isDebug()) console.error(`[BoyfriendTV] Extraction error: ${err.message}`);
  }

  return streams;
}
