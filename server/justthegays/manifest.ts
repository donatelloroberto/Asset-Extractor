import type { StremioManifest } from "../stremio/manifest.js";

export const JUSTTHEGAYS_CATALOG_MAP: Record<
  string,
  { path: string; name: string }
> = {
  "justthegays-latest": { path: "/", name: "JTG-Latest" },
  "justthegays-anal": { path: "/categories/anal-022613/", name: "JTG-Fucking" },
  "justthegays-group": { path: "/categories/group-022613/", name: "JTG-Group" },
  "justthegays-jerkoff": {
    path: "/categories/jerk-off-022613/",
    name: "JTG-Jerk Off",
  },
  "justthegays-latin": { path: "/categories/latin-022613/", name: "JTG-Latin" },
  "justthegays-public": {
    path: "/categories/public-022613/",
    name: "JTG-Public",
  },
};

export function buildJustthegaysManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(
    JUSTTHEGAYS_CATALOG_MAP,
  ).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [{ name: "skip" }],
  }));

  catalogs.unshift({
    type: "movie",
    id: "justthegays-search",
    name: "Justthegays Search",
    extra: [{ name: "search", isRequired: true }, { name: "skip" }],
  });

  return {
    id: "community.justthegays.stremio",
    version: "1.0.0",
    name: "Justthegays",
    description:
      "Justthegays content provider for Stremio - converted from Cloudstream 3 extension",
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
