import type { StremioManifest } from "../stremio/manifest";

export const GAYCOCK4U_CATALOG_MAP: Record<string, { path: string; name: string }> = {
  "gaycock4u-latest": { path: "/", name: "Latest Updates" },
  "gaycock4u-amateur": { path: "/category/amateur/", name: "Amateur" },
  "gaycock4u-bareback": { path: "/category/bareback/", name: "Bareback" },
  "gaycock4u-bigcock": { path: "/category/bigcock/", name: "Big Cock" },
  "gaycock4u-group": { path: "/category/group/", name: "Group" },
  "gaycock4u-hardcore": { path: "/category/hardcore/", name: "Hardcore" },
  "gaycock4u-latino": { path: "/category/latino/", name: "Latino" },
  "gaycock4u-interracial": { path: "/category/interracial/", name: "Interracial" },
  "gaycock4u-twink": { path: "/category/twink/", name: "Twink" },
  "gaycock4u-asianetwork": { path: "/studio/asianetwork/", name: "Asianetwork" },
  "gaycock4u-bromo": { path: "/studio/bromo/", name: "Bromo" },
  "gaycock4u-latinonetwork": { path: "/studio/latinonetwork/", name: "Latino Network" },
  "gaycock4u-lucasentertainment": { path: "/studio/lucasentertainment/", name: "Lucas Entertainment" },
  "gaycock4u-onlyfans": { path: "/studio/onlyfans/", name: "Onlyfans" },
  "gaycock4u-rawfuckclub": { path: "/studio/rawfuckclub/", name: "Raw Fuck Club" },
  "gaycock4u-ragingstallion": { path: "/studio/ragingstallion/", name: "Ragingstallion" },
};

export function buildGaycock4uManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(GAYCOCK4U_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "gaycock4u-search",
    name: "Gaycock4U Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.gaycock4u.stremio",
    version: "1.0.0",
    name: "Gaycock4U",
    description: "Gaycock4U content provider for Stremio - converted from Cloudstream 3 extension",
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
