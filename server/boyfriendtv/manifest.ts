import type { StremioManifest } from "../stremio/manifest";

export const BOYFRIENDTV_CATALOG_MAP: Record<string, { path: string; name: string; isQuery?: boolean }> = {
  "boyfriendtv-trending": { path: "/", name: "BFTV-Trending" },
  "boyfriendtv-newest": { path: "/?filter_quality=hd&s=&sort=newest", name: "Newest", isQuery: true },
  "boyfriendtv-popular": { path: "/?filter_quality=hd&s=&sort=most-popular", name: "BFTV-Most Popular", isQuery: true },
  "boyfriendtv-brazilian": { path: "/tags/brazilian/?filter_quality=hd", name: "BFTV-Brazilian" },
  "boyfriendtv-gangbang": { path: "/tags/gangbang/?filter_quality=hd", name: "BFTV-Gangbang" },
  "boyfriendtv-latinos": { path: "/tags/latinos/?filter_quality=hd", name: "BFTV-Latinos" },
  "boyfriendtv-facedown": { path: "/search/?q=facedownassup&quality=hd", name: "BFTV-Face Down Ass Up", isQuery: true },
  "boyfriendtv-sketchysex": { path: "/search/?q=sketchysex&quality=hd", name: "BFTV-Sketchy Sex", isQuery: true },
  "boyfriendtv-fraternity": { path: "/search/?q=fraternity&quality=hd", name: "BFTV-Fraternity X", isQuery: true },
  "boyfriendtv-slamrush": { path: "/search/?q=slamrush", name: "BFTV-Slam Rush", isQuery: true },
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
