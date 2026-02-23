import type { StremioManifest } from "../stremio/manifest";

export const BOYFRIENDTV_CATALOG_MAP: Record<string, { path: string; name: string; isQuery?: boolean }> = {
  "boyfriendtv-trending": { path: "/", name: "Trending" },
  "boyfriendtv-newest": { path: "/?filter_quality=hd&s=&sort=newest", name: "Newest", isQuery: true },
  "boyfriendtv-popular": { path: "/?filter_quality=hd&s=&sort=most-popular", name: "Most Popular", isQuery: true },
  "boyfriendtv-vietnamese": { path: "/search/?q=Vietnamese", name: "Vietnamese", isQuery: true },
  "boyfriendtv-asian": { path: "/search/?q=asian&hot=", name: "Asian", isQuery: true },
  "boyfriendtv-chinese": { path: "/search/?q=chinese&hot=&quality=hd", name: "Chinese", isQuery: true },
  "boyfriendtv-brazilian": { path: "/tags/brazilian/?filter_quality=hd", name: "Brazilian" },
  "boyfriendtv-gangbang": { path: "/tags/gangbang/?filter_quality=hd", name: "Gangbang" },
  "boyfriendtv-latinos": { path: "/tags/latinos/?filter_quality=hd", name: "Latinos" },
  "boyfriendtv-facedown": { path: "/search/?q=facedownassup&quality=hd", name: "Face Down Ass Up", isQuery: true },
  "boyfriendtv-sketchysex": { path: "/search/?q=sketchysex&quality=hd", name: "Sketchy Sex", isQuery: true },
  "boyfriendtv-fraternity": { path: "/search/?q=fraternity&quality=hd", name: "Fraternity X", isQuery: true },
  "boyfriendtv-slamrush": { path: "/search/?q=slamrush", name: "Slam Rush", isQuery: true },
};

export function buildBoyfriendtvManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(BOYFRIENDTV_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "boyfriendtv-search",
    name: "BoyfriendTV Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.boyfriendtv.stremio",
    version: "1.0.0",
    name: "BoyfriendTV",
    description: "BoyfriendTV content provider for Stremio - converted from Cloudstream 3 extension",
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
