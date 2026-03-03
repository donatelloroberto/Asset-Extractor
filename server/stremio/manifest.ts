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
  "gxtapes-latest": { path: "/?filtre=date&cat=0", name: "GXT-Latest", isQuery: true },
  "gxtapes-shorts": { path: "/gay-porn-shorts-11387/", name: "GXT-#Shorts" },
  "gxtapes-amateur": { path: "/amateur-gay-porn/", name: "GXT-Amateur Cocks" },
  "gxtapes-asian": { path: "/asian-guys-porn/", name: "GXT-Asian" },
  "gxtapes-bareback": { path: "/163012/", name: "GXT-Bareback" },
  "gxtapes-bigdicks": { path: "/831637/", name: "GXT-Big Dicks" },
  "gxtapes-black": { path: "/black-guys-porn-41537/", name: "GXT-Black Guys" },
  "gxtapes-blowjobs": { path: "/56410/", name: "GXT-Blowjobs" },
  "gxtapes-cuminside": { path: "/cum-inside-creampie-145670/", name: "GXT-Cum Inside" },
  "gxtapes-fetish": { path: "/fetish-porn/", name: "GXT-Fetish" },
  "gxtapes-groupsex": { path: "/groupsex-gangbang-porn-129457/", name: "GXT-Group Sex" },
  "gxtapes-hotorgasms": { path: "/hot-orgasms-porn/", name: "GXT-Hot Orgasms" },
  "gxtapes-hunks": { path: "/326279/", name: "GXT-Hunks" },
  "gxtapes-latin": { path: "/256439/", name: "GXT-Latin" },
  "gxtapes-outdoor": { path: "/outdoor-gay-porn/", name: "GXT-Outdoor" },
  "gxtapes-parody": { path: "/porn-parody/", name: "GXT-Parody" },
  "gxtapes-solo": { path: "/jerking-off-videos-64128/", name: "GXT-Solo" },
  "gxtapes-twinks": { path: "/427409/", name: "GXT-Twinks" },
  "gxtapes-uncut": { path: "/246126/", name: "GXT-Uncut Cock / Foreskin" },
  "gxtapes-full-movies": { path: "/porn-movies-214660/", name: "GXT-Full Movies" },
  "gxtapes-games": { path: "/gay-games-porn/", name: "GXT-Games" },
  "gxtapes-onlyfans": { path: "/845903/", name: "GXT-Onlyfans" },
  "gxtapes-8teenboy": { path: "/378563/", name: "GXT-8TeenBoy" },
  "gxtapes-activeduty": { path: "/243871/", name: "GXT-ActiveDuty" },
  "gxtapes-ayor": { path: "/30884/", name: "GXT-Ayor" },
  "gxtapes-badpuppy": { path: "/14004/", name: "GXT-BadPuppy" },
  "gxtapes-baitbuddies": { path: "/547318/", name: "GXT-BaitBuddies" },
  "gxtapes-belamionline": { path: "/687419/", name: "GXT-BelAmiOnline" },
  "gxtapes-bentleyrace": { path: "/65480/", name: "GXT-BentleyRace" },
  "gxtapes-bigdaddy": { path: "/big-daddy/", name: "GXT-BigDaddy" },
  "gxtapes-bilatinmen": { path: "/651385/", name: "GXT-BiLatinMen" },
  "gxtapes-boysontheprowl": { path: "/84740/", name: "GXT-BoysOnTheProwl" },
  "gxtapes-blackgodz": { path: "/18563/", name: "GXT-BlackGodz" },
  "gxtapes-boyfun": { path: "/74713/", name: "GXT-BoyFun" },
  "gxtapes-breeditraw": { path: "/30185/", name: "GXT-BreedItRaw" },
  "gxtapes-brokestraightboys": { path: "/651527/", name: "GXT-BrokeStraightBoys" },
  "gxtapes-bromo": { path: "/854356/", name: "GXT-Bromo" },
  "gxtapes-brothercrush": { path: "/33784/", name: "GXT-BrotherCrush" },
  "gxtapes-brz-studio": { path: "/48416/", name: "GXT-BRZ Studio" },
  "gxtapes-chaosmen": { path: "/749361/", name: "GXT-ChaosMen" },
  "gxtapes-cockyboys": { path: "/267515/", name: "GXT-CockyBoys" },
  "gxtapes-colbyscrew": { path: "/00741/", name: "GXT-Colby's Crew" },
  "gxtapes-corbinfisher": { path: "/865123/", name: "GXT-CorbinFisher" },
  "gxtapes-czechgayamateurs": { path: "/90075/", name: "GXT-CzechGayAmateurs" },
  "gxtapes-czechhunter": { path: "/918752/", name: "GXT-CzechHunter" },
  "gxtapes-debtdandy": { path: "/4185/", name: "GXT-DebtDandy" },
  "gxtapes-dirtyscout": { path: "/38415/", name: "GXT-DirtyScout" },
  "gxtapes-disruptivefilms": { path: "/518197/", name: "GXT-Disruptive Films" },
  "gxtapes-dominicford": { path: "/61778/", name: "GXT-DominicFord" },
  "gxtapes-eastboys": { path: "/873184/", name: "GXT-Eastboys" },
  "gxtapes-extrabigdicks": { path: "/35923/", name: "GXT-ExtraBigDicks" },
  "gxtapes-eurocreme": { path: "/48520/", name: "GXT-EuroCreme" },
  "gxtapes-falconstudios": { path: "/428513/", name: "GXT-FalconStudios" },
  "gxtapes-familydick": { path: "/497953/", name: "GXT-FamilyDick" },
  "gxtapes-fraternityx": { path: "/62478/", name: "GXT-FraternityX" },
  "gxtapes-freshmen": { path: "/49068/", name: "GXT-FreshMen / KinkyAngels" },
  "gxtapes-fuckermate": { path: "/784568/", name: "GXT-FuckerMate" },
  "gxtapes-gayhoopla": { path: "/37433/", name: "GXT-GayHoopla" },
  "gxtapes-gaypatrol": { path: "/71487/", name: "GXT-GayPatrol" },
  "gxtapes-gayroom": { path: "/37840/", name: "GXT-GayRoom" },
  "gxtapes-gaywire": { path: "/4793/", name: "GXT-GayWire" },
  "gxtapes-guysinsweatpants": { path: "/458743/", name: "GXT-GuysInSweatpants" },
  "gxtapes-hardbritlads": { path: "/33870/", name: "GXT-HardBritLads" },
  "gxtapes-helixstudios": { path: "/378563/", name: "GXT-HelixStudios" },
  "gxtapes-hotboys": { path: "/10879/", name: "GXT-HotBoys" },
  "gxtapes-hothouse": { path: "/64796/", name: "GXT-HotHouse" },
  "gxtapes-iconmale": { path: "/54870/", name: "GXT-IconMale" },
  "gxtapes-irmaosdotados": { path: "/756382/", name: "GXT-IrmaosDotados" },
  "gxtapes-keumgay": { path: "/25480/", name: "GXT-KeumGay" },
  "gxtapes-kristenbjorn": { path: "/432724/", name: "GXT-KristenBjorn" },
  "gxtapes-latinboyz": { path: "/263810/", name: "GXT-LatinBoyz" },
  "gxtapes-latinleche": { path: "/456021/", name: "GXT-LatinLeche" },
  "gxtapes-lucasentertainment": { path: "/571476/", name: "GXT-LucasEntertainment" },
  "gxtapes-lucaskazan": { path: "/39788/", name: "GXT-LucasKazan" },
  "gxtapes-luciosaints": { path: "/02567/", name: "GXT-LucioSaints" },
  "gxtapes-machofucker": { path: "/95710/", name: "GXT-Machofucker" },
  "gxtapes-maskurbate": { path: "/00547/", name: "GXT-Maskurbate" },
  "gxtapes-masqulin": { path: "/632526/", name: "GXT-Masqulin / BroNetwork" },
  "gxtapes-men": { path: "/382421/", name: "GXT-MEN" },
  "gxtapes-menatplay": { path: "/757158/", name: "GXT-MenAtPlay" },
  "gxtapes-meninosonline": { path: "/367524/", name: "GXT-MeninosOnline" },
  "gxtapes-missionaryboys": { path: "/357509/", name: "GXT-MissionaryBoys" },
  "gxtapes-nakedsword": { path: "/296272/", name: "GXT-NakedSword" },
  "gxtapes-nextdoorstudios": { path: "/792756/", name: "GXT-NextDoorStudios" },
  "gxtapes-noirmale": { path: "/38562/", name: "GXT-NoirMale" },
  "gxtapes-peterfever": { path: "/84750/", name: "GXT-PeterFever" },
  "gxtapes-ragingstallion": { path: "/418264/", name: "GXT-RagingStallion" },
  "gxtapes-randyblue": { path: "/402389/", name: "GXT-RandyBlue" },
  "gxtapes-rawstrokes": { path: "/84910/", name: "GXT-RawStrokes" },
  "gxtapes-sayuncle": { path: "/527193/", name: "GXT-SayUncle" },
  "gxtapes-seancody": { path: "/349693/", name: "GXT-SeanCody" },
  "gxtapes-staghomme": { path: "/76354/", name: "GXT-StagHomme" },
  "gxtapes-staxus": { path: "/61271/", name: "GXT-Staxus" },
  "gxtapes-straightfellas": { path: "/02165/", name: "GXT-StraightFellas" },
  "gxtapes-timtales": { path: "/182658/", name: "GXT-TimTales" },
  "gxtapes-titanmen": { path: "/98940/", name: "GXT-TitanMen" },
  "gxtapes-twinktop": { path: "/97213/", name: "GXT-TwinkTop" },
  "gxtapes-ukhotjocks": { path: "/96487/", name: "GXT-UKHotJocks" },
  "gxtapes-uknakedmen": { path: "/66470/", name: "GXT-UKNakedMen" },
  "gxtapes-williamhiggins": { path: "/36567/", name: "GXT-WilliamHiggins" },
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
