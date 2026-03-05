import type { StremioManifest } from "../stremio/manifest.js";

export const GAYCOCK4U_CATALOG_MAP: Record<
  string,
  { path: string; name: string }
> = {
  "gaycock4u-latest": { path: "/", name: "GC4U-Latest Updates" },
};

export function buildGaycock4uManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(
    GAYCOCK4U_CATALOG_MAP,
  ).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [{ name: "skip" }],
  }));

  catalogs.unshift({
    type: "movie",
    id: "gaycock4u-search",
    name: "Gaycock4U Search",
    extra: [{ name: "search", isRequired: true }, { name: "skip" }],
  });

  return {
    id: "community.gaycock4u.stremio",
    version: "1.0.0",
    name: "Gaycock4U",
    description:
      "Gaycock4U content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["gaycock4u:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
