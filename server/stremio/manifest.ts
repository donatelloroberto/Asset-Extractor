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
  "gxtapes-8teenboy": { path: "/378563/", name: "8TeenBoy" },
  "gxtapes-activeduty": { path: "/243871/", name: "ActiveDuty" },
  "gxtapes-ayor": { path: "/30884/", name: "Ayor" },
  "gxtapes-badpuppy": { path: "/14004/", name: "BadPuppy" },
  "gxtapes-baitbuddies": { path: "/547318/", name: "BaitBuddies" },
  "gxtapes-belamionline": { path: "/687419/", name: "BelAmiOnline" },
  "gxtapes-bentleyrace": { path: "/65480/", name: "BentleyRace" },
  "gxtapes-bigdaddy": { path: "/big-daddy/", name: "BigDaddy" },
  "gxtapes-bilatinmen": { path: "/651385/", name: "BiLatinMen" },
  "gxtapes-boysontheprowl": { path: "/84740/", name: "BoysOnTheProwl" },
  "gxtapes-blackgodz": { path: "/18563/", name: "BlackGodz" },
  "gxtapes-boyfun": { path: "/74713/", name: "BoyFun" },
  "gxtapes-breeditraw": { path: "/30185/", name: "BreedItRaw" },
  "gxtapes-brokestraightboys": { path: "/651527/", name: "BrokeStraightBoys" },
  "gxtapes-bromo": { path: "/854356/", name: "Bromo" },
  "gxtapes-brothercrush": { path: "/33784/", name: "BrotherCrush" },
  "gxtapes-brz-studio": { path: "/48416/", name: "BRZ Studio" },
  "gxtapes-chaosmen": { path: "/749361/", name: "ChaosMen" },
  "gxtapes-cockyboys": { path: "/267515/", name: "CockyBoys" },
  "gxtapes-colbyscrew": { path: "/00741/", name: "Colby's Crew" },
  "gxtapes-corbinfisher": { path: "/865123/", name: "CorbinFisher" },
  "gxtapes-czechgayamateurs": { path: "/90075/", name: "CzechGayAmateurs" },
  "gxtapes-czechhunter": { path: "/918752/", name: "CzechHunter" },
  "gxtapes-debtdandy": { path: "/4185/", name: "DebtDandy" },
  "gxtapes-dirtyscout": { path: "/38415/", name: "DirtyScout" },
  "gxtapes-disruptivefilms": { path: "/518197/", name: "Disruptive Films" },
  "gxtapes-dominicford": { path: "/61778/", name: "DominicFord" },
  "gxtapes-eastboys": { path: "/873184/", name: "Eastboys" },
  "gxtapes-extrabigdicks": { path: "/35923/", name: "ExtraBigDicks" },
  "gxtapes-eurocreme": { path: "/48520/", name: "EuroCreme" },
  "gxtapes-falconstudios": { path: "/428513/", name: "FalconStudios" },
  "gxtapes-familydick": { path: "/497953/", name: "FamilyDick" },
  "gxtapes-fraternityx": { path: "/62478/", name: "FraternityX" },
  "gxtapes-freshmen": { path: "/49068/", name: "FreshMen / KinkyAngels" },
  "gxtapes-fuckermate": { path: "/784568/", name: "FuckerMate" },
  "gxtapes-gayhoopla": { path: "/37433/", name: "GayHoopla" },
  "gxtapes-gaypatrol": { path: "/71487/", name: "GayPatrol" },
  "gxtapes-gayroom": { path: "/37840/", name: "GayRoom" },
  "gxtapes-gaywire": { path: "/4793/", name: "GayWire" },
  "gxtapes-guysinsweatpants": { path: "/458743/", name: "GuysInSweatpants" },
  "gxtapes-hardbritlads": { path: "/33870/", name: "HardBritLads" },
  "gxtapes-helixstudios": { path: "/378563/", name: "HelixStudios" },
  "gxtapes-hotboys": { path: "/10879/", name: "HotBoys" },
  "gxtapes-hothouse": { path: "/64796/", name: "HotHouse" },
  "gxtapes-iconmale": { path: "/54870/", name: "IconMale" },
  "gxtapes-irmaosdotados": { path: "/756382/", name: "IrmaosDotados" },
  "gxtapes-keumgay": { path: "/25480/", name: "KeumGay" },
  "gxtapes-kristenbjorn": { path: "/432724/", name: "KristenBjorn" },
  "gxtapes-latinboyz": { path: "/263810/", name: "LatinBoyz" },
  "gxtapes-latinleche": { path: "/456021/", name: "LatinLeche" },
  "gxtapes-lucasentertainment": { path: "/571476/", name: "LucasEntertainment" },
  "gxtapes-lucaskazan": { path: "/39788/", name: "LucasKazan" },
  "gxtapes-luciosaints": { path: "/02567/", name: "LucioSaints" },
  "gxtapes-machofucker": { path: "/95710/", name: "Machofucker" },
  "gxtapes-maskurbate": { path: "/00547/", name: "Maskurbate" },
  "gxtapes-masqulin": { path: "/632526/", name: "Masqulin / BroNetwork" },
  "gxtapes-men": { path: "/382421/", name: "MEN" },
  "gxtapes-menatplay": { path: "/757158/", name: "MenAtPlay" },
  "gxtapes-meninosonline": { path: "/367524/", name: "MeninosOnline" },
  "gxtapes-missionaryboys": { path: "/357509/", name: "MissionaryBoys" },
  "gxtapes-nakedsword": { path: "/296272/", name: "NakedSword" },
  "gxtapes-nextdoorstudios": { path: "/792756/", name: "NextDoorStudios" },
  "gxtapes-noirmale": { path: "/38562/", name: "NoirMale" },
  "gxtapes-peterfever": { path: "/84750/", name: "PeterFever" },
  "gxtapes-ragingstallion": { path: "/418264/", name: "RagingStallion" },
  "gxtapes-randyblue": { path: "/402389/", name: "RandyBlue" },
  "gxtapes-rawstrokes": { path: "/84910/", name: "RawStrokes" },
  "gxtapes-sayuncle": { path: "/527193/", name: "SayUncle" },
  "gxtapes-seancody": { path: "/349693/", name: "SeanCody" },
  "gxtapes-staghomme": { path: "/76354/", name: "StagHomme" },
  "gxtapes-staxus": { path: "/61271/", name: "Staxus" },
  "gxtapes-straightfellas": { path: "/02165/", name: "StraightFellas" },
  "gxtapes-timtales": { path: "/182658/", name: "TimTales" },
  "gxtapes-titanmen": { path: "/98940/", name: "TitanMen" },
  "gxtapes-twinktop": { path: "/97213/", name: "TwinkTop" },
  "gxtapes-ukhotjocks": { path: "/96487/", name: "UKHotJocks" },
  "gxtapes-uknakedmen": { path: "/66470/", name: "UKNakedMen" },
  "gxtapes-williamhiggins": { path: "/36567/", name: "WilliamHiggins" },
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
