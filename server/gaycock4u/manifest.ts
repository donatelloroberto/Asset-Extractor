import type { StremioManifest } from "../stremio/manifest.js";

export const GAYCOCK4U_CATALOG_MAP: Record<
  string,
  { path: string; name: string }
> = {
  "gaycock4u-latest": { path: "/", name: "GC4U-Latest Updates" },
  "gaycock4u-MEN": { path: "/video-tag/MEN/", name: "GC4U-MEN" },
  "gaycock4u-Bromo": { path: "/video-tag/Bromo/", name: "GC4U-Bromo" },
  "gaycock4u-NextDoorStudios": { path: "/video-tag/NextDoorStudios/", name: "GC4U-NextDoorStudios" },
  "gaycock4u-PrideStudios": { path: "/video-tag/PrideStudios/", name: "GC4U-PrideStudios" },
  "gaycock4u-BrotherCrush": { path: "/video-tag/BrotherCrush/", name: "GC4U-BrotherCrush" },
  "gaycock4u-FalconStudios": { path: "/video-tag/FalconStudios/", name: "GC4U-FalconStudios" },
  "gaycock4u-IconMale": { path: "/video-tag/IconMale/", name: "GC4U-IconMale" },
  "gaycock4u-KristenBjorn": { path: "/video-tag/KristenBjorn/", name: "GC4U-KristenBjorn" },
  "gaycock4u-LatinLeche": { path: "/video-tag/LatinLeche/", name: "GC4U-LatinLeche" },
  "gaycock4u-LucasEntertainment": { path: "/video-tag/LucasEntertainment/", name: "GC4U-LucasEntertainment" },
  "gaycock4u-NakedSword": { path: "/video-tag/NakedSword/", name: "GC4U-NakedSword" },
  "gaycock4u-NoirMale": { path: "/video-tag/NoirMale/", name: "GC4U-NoirMale" },
  "gaycock4u-RagingStallion": { path: "/video-tag/RagingStallion/", name: "GC4U-RagingStallion" },
  "gaycock4u-RandyBlue": { path: "/video-tag/RandyBlue/", name: "GC4U-RandyBlue" },
  "gaycock4u-SayUncle": { path: "/video-tag/SayUncle/", name: "GC4U-SayUncle" },
  "gaycock4u-SeanCody": { path: "/video-tag/SeanCody/", name: "GC4U-SeanCody" },
  "gaycock4u-TitanMen": { path: "/video-tag/TitanMen/", name: "GC4U-TitanMen" },
  "gaycock4u-Vintage": { path: "/video-tag/Vintage/", name: "GC4U-Vintage" },
  "gaycock4u-YoungPerps": { path: "/video-tag/YoungPerps/", name: "GC4U-YoungPerps" },
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
