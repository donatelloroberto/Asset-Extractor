import type { StremioManifest } from "../stremio/manifest.js";

export const BOYFRIENDTV_CATALOG_MAP: Record<
  string,
  { path: string; name: string; isQuery?: boolean }
> = {
  "boyfriendtv-trending": { path: "/", name: "BfTV-Trending" },
  "boyfriendtv-newest": {
    path: "/?filter_quality=hd&s=&sort=newest",
    name: "BfTV-Newest",
    isQuery: true,
  },
  "boyfriendtv-popular": {
    path: "/?filter_quality=hd&s=&sort=most-popular",
    name: "BfTV-Most Popular",
    isQuery: true,
  },
};

export function buildBoyfriendtvManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(
    BOYFRIENDTV_CATALOG_MAP,
  ).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [{ name: "skip" }],
  }));

  catalogs.unshift({
    type: "movie",
    id: "boyfriendtv-search",
    name: "BoyfriendTV Search",
    extra: [{ name: "search", isRequired: true }, { name: "skip" }],
  });

  return {
    id: "community.boyfriendtv.stremio",
    version: "1.0.0",
    name: "BoyfriendTV",
    description:
      "BoyfriendTV content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["boyfriendtv:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
