import type { StremioManifest } from "../stremio/manifest";

export const JUSTTHEGAYS_CATALOG_MAP: Record<string, { path: string; name: string }> = {
  "justthegays-latest": { path: "/", name: "JustTheG-Latest" },
  "justthegays-anal": { path: "/categories/anal-022613/", name: "JustTheG-Fucking" },
  "justthegays-black": { path: "/categories/black-022613/", name: "JustTheG-Black" },
  "justthegays-dp": { path: "/categories/double-penetration-022613/", name: "JustTheG-Double Penetration" },
  "justthegays-feet": { path: "/categories/feet-022613/", name: "JustTheG-Feet" },
  "justthegays-fisting": { path: "/categories/fisting-022613/", name: "JustTheG-Fisting" },
  "justthegays-group": { path: "/categories/group-022613/", name: "JustTheG-Group" },
  "justthegays-jerkoff": { path: "/categories/jerk-off-022613/", name: "JustTheG-Jerk Off" },
  "justthegays-latin": { path: "/categories/latin-022613/", name: "JustTheG-Latin" },
  "justthegays-massage": { path: "/categories/massage-022613/", name: "JustTheG-Massage" },
  "justthegays-oral": { path: "/categories/oral-022613/", name: "JustTheG-Oral" },
  "justthegays-public": { path: "/categories/public-022613/", name: "JustTheG-Public" },
  "justthegays-worship": { path: "/categories/worship-022613/", name: "JustTheG-Worship" }
};

export function buildJustthegaysManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(JUSTTHEGAYS_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "justthegays-search",
    name: "Justthegays Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.justthegays.stremio",
    version: "1.0.0",
    name: "Justthegays",
    description: "Justthegays content provider for Stremio - converted from Cloudstream 3 extension",
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
