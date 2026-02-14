export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  resources: string[];
  types: string[];
  catalogs: Array<{
    type: string;
    id: string;
    name: string;
    extra?: Array<{
      name: string;
      isRequired?: boolean;
      options?: string[];
    }>;
  }>;
  idPrefixes: string[];
  behaviorHints?: {
    adult?: boolean;
    configurable?: boolean;
  };
}

export const CATALOG_MAP: Record<string, { path: string; name: string }> = {
  "gxtapes-latest": { path: "/?filtre=date&cat=0", name: "Latest" },
  "gxtapes-full-movies": { path: "/category/porn-movies-214660", name: "Full Movies" },
  "gxtapes-groupsex": { path: "/category/groupsex-gangbang-porn-189457", name: "Gang bang & Group" },
  "gxtapes-corbin-fisher": { path: "/category/860425", name: "Corbin Fisher" },
  "gxtapes-timtales": { path: "/category/139616", name: "Timtales" },
  "gxtapes-bel-ami": { path: "/category/687469", name: "Bel Ami" },
  "gxtapes-broke-straight-boys": { path: "/category/651571", name: "Broke Straight Boys" },
  "gxtapes-bromo": { path: "/category/850356", name: "BroMo" },
  "gxtapes-cockyboys": { path: "/category/847926", name: "CockyBoys" },
  "gxtapes-sean-cody": { path: "/category/346893", name: "Sean Cody" },
  "gxtapes-fraternity-x": { path: "/category/62478", name: "Fraternity X" },
  "gxtapes-falcon-studio": { path: "/category/416510", name: "Falcon Studio" },
  "gxtapes-gay-hoopla": { path: "/category/37433", name: "Gay Hoopla" },
  "gxtapes-onlyfans": { path: "/category/621537", name: "Onlyfans" },
};

export function buildManifest(): StremioManifest {
  const catalogs = Object.entries(CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "gxtapes-search",
    name: "GXtapes Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.gxtapes.stremio",
    version: "1.0.0",
    name: "GXtapes",
    description: "GXtapes content provider for Stremio - converted from Cloudstream 3 extension",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs,
    idPrefixes: ["gxtapes:"],
    behaviorHints: {
      adult: true,
      configurable: false,
    },
  };
}
