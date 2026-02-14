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
    extra?: Array<{ name: string; isRequired?: boolean; options?: string[] }>;
  }>;
  idPrefixes: string[];
  behaviorHints?: {
    adult?: boolean;
    configurable?: boolean;
  };
}

export const CATALOG_MAP: Record<string, { path: string; name: string; isQuery?: boolean }> = {
  "gxtapes-latest": { path: "/?filtre=date&cat=0", name: "Latest", isQuery: true },
  "gxtapes-shorts": { path: "/gay-porn-shorts-11387/", name: "#Shorts" },
  "gxtapes-amateur": { path: "/amateur-gay-porn/", name: "Amateur Cocks" },
  "gxtapes-asian": { path: "/asian-guys-porn/", name: "Asian" },
  "gxtapes-bareback": { path: "/163012/", name: "Bareback" },
  "gxtapes-bigdicks": { path: "/831637/", name: "Big Dicks" },
  "gxtapes-black": { path: "/black-guys-porn-41537/", name: "Black Guys" },
  "gxtapes-blowjobs": { path: "/56410/", name: "Blowjobs" },
  "gxtapes-cuminside": { path: "/cum-inside-creampie-145670/", name: "Cum Inside" },
  "gxtapes-fetish": { path: "/fetish-porn/", name: "Fetish" },
  "gxtapes-groupsex": { path: "/groupsex-gangbang-porn-129457/", name: "Group Sex" },
  "gxtapes-hotorgasms": { path: "/hot-orgasms-porn/", name: "Hot Orgasms" },
  "gxtapes-hunks": { path: "/326279/", name: "Hunks" },
  "gxtapes-latin": { path: "/256439/", name: "Latin" },
  "gxtapes-outdoor": { path: "/outdoor-gay-porn/", name: "Outdoor" },
  "gxtapes-parody": { path: "/porn-parody/", name: "Parody" },
  "gxtapes-solo": { path: "/jerking-off-videos-64128/", name: "Solo" },
  "gxtapes-twinks": { path: "/427409/", name: "Twinks" },
  "gxtapes-uncut": { path: "/246126/", name: "Uncut Cock / Foreskin" },
  "gxtapes-full-movies": { path: "/porn-movies-214660/", name: "Full Movies" },
  "gxtapes-games": { path: "/gay-games-porn/", name: "Games" },
  "gxtapes-onlyfans": { path: "/845903/", name: "Onlyfans" },
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
};

export function buildManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(CATALOG_MAP).map(([id, { name }]) => ({
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
