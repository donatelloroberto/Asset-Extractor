import type { StremioManifest } from "../stremio/manifest";

export const NURGAY_CATALOG_MAP: Record<string, { path: string; name: string; isQuery?: boolean }> = {
  "nurgay-latest": { path: "/?filter=latest", name: "Latest", isQuery: true },
  "nurgay-most-viewed": { path: "/?filter=most-viewed", name: "Most Viewed", isQuery: true },
  "nurgay-amateur": { path: "/amateur/", name: "Amateur" },
  "nurgay-anal": { path: "/anal/", name: "Anal" },
  "nurgay-animation": { path: "/animation/", name: "Animation" },
  "nurgay-arab": { path: "/araber/", name: "Araber" },
  "nurgay-asian": { path: "/asiaten/", name: "Asian" },
  "nurgay-bareback": { path: "/bareback/", name: "Bareback" },
  "nurgay-bears": { path: "/baeren/", name: "Bears" },
  "nurgay-bdsm": { path: "/bdsm-fetisch/", name: "BDSM / Fetisch" },
  "nurgay-bisex": { path: "/bisex/", name: "Bisexual" },
  "nurgay-blowjob": { path: "/blowjob/", name: "Blowjob" },
  "nurgay-clips": { path: "/clips/", name: "Clips" },
  "nurgay-compilation": { path: "/compilation/", name: "Compilation" },
  "nurgay-cross-dressing": { path: "/cross-dressing/", name: "Cross Dressing" },
  "nurgay-cross-generation": { path: "/cross-generation/", name: "Cross Generation" },
  "nurgay-cumshot": { path: "/cumshot/", name: "CumShot" },
  "nurgay-daddy": { path: "/daddy/", name: "Daddy" },
  "nurgay-deutsch": { path: "/deutsch-german/", name: "Deutsch / German" },
  "nurgay-fisting": { path: "/fisting/", name: "Fisting" },
  "nurgay-feet": { path: "/fuesse-feet/", name: "Feet / Socks" },
  "nurgay-groupsex": { path: "/gruppensex/", name: "Group Sex" },
  "nurgay-hairy": { path: "/harrig/", name: "Hairy" },
  "nurgay-hunks": { path: "/hunks/", name: "Hunks" },
  "nurgay-interracial": { path: "/interracial/", name: "Interracial" },
  "nurgay-kinky": { path: "/kinky/", name: "Kinky" },
  "nurgay-latino": { path: "/latino/", name: "Latino" },
  "nurgay-leather": { path: "/leder/", name: "Leather" },
  "nurgay-muscle": { path: "/muskeln/", name: "Muscle" },
  "nurgay-piss": { path: "/natursekt/", name: "Natursekt" },
  "nurgay-outdoor": { path: "/public-outdoor/", name: "Public / Outdoor" },
  "nurgay-black": { path: "/schoko/", name: "Black" },
  "nurgay-solo": { path: "/solo/", name: "Solo" },
  "nurgay-cumplay": { path: "/sperma-cumshot/", name: "Sperma & Cumshot" },
  "nurgay-trans": { path: "/trans/", name: "Trans" },
  "nurgay-twinks": { path: "/twinks/", name: "Twinks" },
  "nurgay-uniform": { path: "/uniform/", name: "Uniform" },
  "nurgay-unsorted": { path: "/gay-pornos/", name: "Unsorted" },
  "nurgay-vintage": { path: "/vintage/", name: "Vintage" },
  "nurgay-twins": { path: "/zwillinge/", name: "Twins" },
};

export function buildNurgayManifest(): StremioManifest {
  const catalogs: StremioManifest["catalogs"] = Object.entries(NURGAY_CATALOG_MAP).map(([id, { name }]) => ({
    type: "movie",
    id,
    name,
    extra: [
      { name: "skip" },
    ],
  }));

  catalogs.unshift({
    type: "movie",
    id: "nurgay-search",
    name: "Nurgay Search",
    extra: [
      { name: "search", isRequired: true },
      { name: "skip" },
    ],
  });

  return {
    id: "community.nurgay.stremio",
    version: "1.0.0",
    name: "Nurgay",
    description: "Nurgay content provider for Stremio - converted from Cloudstream 3 extension",
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
