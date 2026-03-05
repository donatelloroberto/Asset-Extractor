import type { StremioManifest } from "../stremio/manifest.js";

export const GAYSTREAM_CATALOG_MAP: Record<
  string,
  { path: string; name: string }
> = {
  "gaystream-latest": { path: "/", name: "GayS-Latest" },
  "gaystream-4k": { path: "/video/category/4k", name: "GayS-4K" },
  "gaystream-hunk": { path: "/video/category/hunk", name: "GayS-Hunk" },
  "gaystream-latino": { path: "/video/category/latino", name: "GayS-Latino" },
  "gaystream-promotion": {
    path: "/video/category/promotion",
    name: "GayS-Promotion",
  },
  "gaystream-threesome": {
    path: "/video/category/threesome",
    name: "GayS-Threesome",
  },
};

export function buildGaystreamManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(
    GAYSTREAM_CATALOG_MAP,
  ).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [{ name: "skip" }],
  }));

  catalogs.unshift({
    type: "movie",
    id: "gaystream-search",
    name: "GayStream Search",
    extra: [{ name: "search", isRequired: true }, { name: "skip" }],
  });

  return {
    id: "community.gaystream.stremio",
    version: "1.0.0",
    name: "GayStream",
    description:
      "GayStream content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["gaystream:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
