import type { StremioManifest } from "../stremio/manifest";

export const GAYSTREAM_CATALOG_MAP: Record<string, { path: string; name: string }> = {
 "gaystream-latest": { path: "/", name: "GStream-Latest" },
  "gaystream-4k": { path: "/video/category/4k", name: "GStream-4K" },
  "gaystream-anal": { path: "/video/category/anal", name: "GStream-Anal" },
  "gaystream-asian": { path: "/video/category/asian", name: "GStream-Asian" },
  "gaystream-dp": { path: "/video/category/dp", name: "GStream-DP" },
  "gaystream-group": { path: "/video/category/group", name: "GStream-Group" },
  "gaystream-homemade": { path: "/video/category/homemade", name: "GStream-Homemade" },
  "gaystream-hunk": { path: "/video/category/hunk", name: "GStream-Hunk" },
  "gaystream-interracial": { path: "/video/category/interracial", name: "GStream-Interracial" },
  "gaystream-latino": { path: "/video/category/latino", name: "GStream-Latino" },
  "gaystream-mature": { path: "/video/category/mature", name: "GStream-Mature" },
  "gaystream-muscle": { path: "/video/category/muscle", name: "GStream-Muscle" },
  "gaystream-promotion": { path: "/video/category/promotion", name: "GStream-Promotion" },
  "gaystream-threesome": { path: "/video/category/threesome", name: "GStream-Threesome" },
  "gaystream-uniforms": { path: "/video/category/uniforms", name: "GStream-Uniforms" },
  "gaystream-betabetapi": { path: "/video/channel/betabetapi", name: "GStream-Beta Beta Pi" },
  "gaystream-caninolatino": { path: "/video/channel/caninolatino", name: "GStream-Canino Latino" }
};

export function buildGaystreamManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(GAYSTREAM_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "gaystream-search",
    name: "GayStream Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.gaystream.stremio",
    version: "1.0.0",
    name: "GayStream",
    description: "GayStream content provider for Stremio - converted from Cloudstream 3 extension",
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
