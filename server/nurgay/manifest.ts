import type { StremioManifest } from "../stremio/manifest.js";

export const NURGAY_CATALOG_MAP: Record<
  string,
  { path: string; name: string; isQuery?: boolean }
> = {
  "nurgay-latest": {
    path: "/?filter=latest",
    name: "NurG-Latest",
    isQuery: true,
  },
  "nurgay-most-viewed": {
    path: "/?filter=most-viewed",
    name: "NurG-Most Viewed",
    isQuery: true,
  },
  "nurgay-animation": { path: "/animation/", name: "NurG-Animation" },
  "nurgay-arab": { path: "/araber/", name: "NurG-Araber" },
  "nurgay-bareback": { path: "/bareback/", name: "NurG-Bareback" },
  "nurgay-clips": { path: "/clips/", name: "NurG-Clips" },
  "nurgay-compilation": { path: "/compilation/", name: "NurG-Compilation" },
  "nurgay-groupsex": { path: "/gruppensex/", name: "NurG-Group Sex" },
  "nurgay-hairy": { path: "/harrig/", name: "NurG-Hairy" },
  "nurgay-hunks": { path: "/hunks/", name: "NurG-Hunks" },
  "nurgay-latino": { path: "/latino/", name: "NurG-Latino" },
  "nurgay-unsorted": { path: "/gay-pornos/", name: "NurG-Unsorted" },
  "nurgay-vintage": { path: "/vintage/", name: "NurG-Vintage" },
};

export function buildNurgayManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(
    NURGAY_CATALOG_MAP,
  ).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [{ name: "skip" }],
  }));

  catalogs.unshift({
    type: "movie",
    id: "nurgay-search",
    name: "Nurgay Search",
    extra: [{ name: "search", isRequired: true }, { name: "skip" }],
  });

  return {
    id: "community.nurgay.stremio",
    version: "1.0.0",
    name: "Nurgay",
    description:
      "Nurgay content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["nurgay:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
