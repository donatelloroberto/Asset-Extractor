import type { StremioManifest } from "../stremio/manifest";

export const BESTHDGAYPORN_CATALOG_MAP: Record<string, { path: string; name: string }> = {
  "besthdgayporn-latest": { path: "/", name: "Latest" },
  "besthdgayporn-men-com": { path: "/video-tag/men-com/", name: "MEN.com" },
  "besthdgayporn-bareback": { path: "/video-tag/bareback-gay-porn/", name: "Bareback" },
  "besthdgayporn-onlyfans": { path: "/video-tag/onlyfans/", name: "Onlyfans" },
  "besthdgayporn-latino": { path: "/video-tag/latino/", name: "Latino" },
  "besthdgayporn-voyr": { path: "/video-tag/voyr/", name: "Voyr" },
  "besthdgayporn-chaos-men": { path: "/video-tag/chaos-men/", name: "Chaos Men" },
  "besthdgayporn-nakedsword": { path: "/video-tag/nakedsword/", name: "Naked Sword" },
};

export function buildBesthdgaypornManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(BESTHDGAYPORN_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "besthdgayporn-search",
    name: "BestHDgayporn Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.besthdgayporn.stremio",
    version: "1.0.0",
    name: "BestHDgayporn",
    description: "BestHDgayporn content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["besthdgayporn:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
