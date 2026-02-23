import type { StremioManifest } from "../stremio/manifest";

export const JUSTTHEGAYS_CATALOG_MAP: Record<string, { path: string; name: string }> = {
  "justthegays-latest": { path: "/", name: "Latest" },
  "justthegays-random": { path: "/random-82530/", name: "Random" },
  "justthegays-popular": { path: "/popular-82530/", name: "Popular" },
  "justthegays-trending": { path: "/trending-82530/", name: "Trending" },
  "justthegays-anal": { path: "/categories/anal-082529/", name: "Fucking" },
  "justthegays-group": { path: "/categories/group-082529/", name: "Group" },
  "justthegays-latin": { path: "/categories/latin-082529/", name: "Latin" },
  "justthegays-worship": { path: "/categories/worship-082529/", name: "Worship" },
};

export function buildJustthegaysManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(JUSTTHEGAYS_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "justthegays-search",
    name: "Justthegays Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.justthegays.stremio",
    version: "1.0.0",
    name: "Justthegays",
    description: "Justthegays content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["justthegays:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
