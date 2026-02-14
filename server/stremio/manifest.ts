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

export const CATALOG_MAP: Record<string, { path: string; name: string; isQuery?: boolean }> = {
  "gxtapes-latest": { path: "/?filtre=date&cat=0", name: "Latest", isQuery: true },
  "gxtapes-full-movies": { path: "/porn-movies-214660/", name: "Full Movies" },
  "gxtapes-groupsex": { path: "/groupsex-gangbang-porn-129457/", name: "Gang bang & Group" },
  "gxtapes-corbin-fisher": { path: "/865123/", name: "Corbin Fisher" },
  "gxtapes-timtales": { path: "/182658/", name: "Timtales" },
  "gxtapes-bel-ami": { path: "/687419/", name: "Bel Ami" },
  "gxtapes-broke-straight-boys": { path: "/651527/", name: "Broke Straight Boys" },
  "gxtapes-bromo": { path: "/854356/", name: "BroMo" },
  "gxtapes-cockyboys": { path: "/267515/", name: "CockyBoys" },
  "gxtapes-sean-cody": { path: "/349693/", name: "Sean Cody" },
  "gxtapes-fraternity-x": { path: "/62478/", name: "Fraternity X" },
  "gxtapes-falcon-studio": { path: "/428513/", name: "Falcon Studio" },
  "gxtapes-gay-hoopla": { path: "/37433/", name: "Gay Hoopla" },
  "gxtapes-onlyfans": { path: "/845903/", name: "Onlyfans" },
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
