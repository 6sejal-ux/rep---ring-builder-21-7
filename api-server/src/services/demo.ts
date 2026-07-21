/**
 * Demo Diamond Service
 *
 * Returns realistic fake diamond data so the app works end-to-end
 * without Nivoda credentials.
 *
 * Switch between demo and live data via the DIAMOND_DATA_SOURCE env var:
 *   DIAMOND_DATA_SOURCE=demo   → this file (default)
 *   DIAMOND_DATA_SOURCE=nivoda → services/nivoda.ts
 *
 * The interface intentionally mirrors nivoda.ts so the routes need
 * no changes when switching data sources.
 */

import type {
  DiamondSearchFilters,
  NivodaDiamond,
  SearchResult,
} from "./nivoda.js";

// ── Demo dataset ──────────────────────────────────────────────────────────────

/**
 * Diamond shape → local representative image path.
 * Served from artifacts/ring-builder/public/media/diamonds/.
 * The BASE_URL prefix is intentionally omitted here — the frontend
 * prepends it via its asset helper or by serving from /media/diamonds/.
 */
const SHAPE_IMAGE: Record<string, string> = {
  ROUND:    '/media/diamonds/round.svg',
  OVAL:     '/media/diamonds/oval.svg',
  PRINCESS: '/media/diamonds/princess.svg',
  CUSHION:  '/media/diamonds/cushion.svg',
  EMERALD:  '/media/diamonds/emerald.svg',
  ASSCHER:  '/media/diamonds/asscher.svg',
  PEAR:     '/media/diamonds/pear.svg',
  RADIANT:  '/media/diamonds/radiant.svg',
  MARQUISE: '/media/diamonds/marquise.svg',
  HEART:    '/media/diamonds/heart.svg',
};

interface RawDemo {
  id: string; shape: string; carats: number; color: string; clarity: string;
  cut: string; polish: string; symmetry: string; fluorescence: string;
  lab: string; certNumber: string; price: number;
  length: number; width: number; depth: number;
  table: number; depthPct: number;
}

const RAW: RawDemo[] = [
  // ── Round (20) ───────────────────────────────────────────────────────────
  { id:"DEMO-GIA-2487651",shape:"ROUND",carats:0.51,color:"F",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2487651001",price:1950,length:5.13,width:5.16,depth:3.18,table:57,depthPct:61.8 },
  { id:"DEMO-GIA-2491023",shape:"ROUND",carats:0.70,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"2491023002",price:2780,length:5.71,width:5.74,depth:3.54,table:58,depthPct:61.9 },
  { id:"DEMO-GIA-2503847",shape:"ROUND",carats:0.90,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"Faint",lab:"GIA",certNumber:"2503847003",price:3850,length:6.19,width:6.22,depth:3.83,table:56,depthPct:61.7 },
  { id:"DEMO-GIA-2518294",shape:"ROUND",carats:1.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2518294004",price:7200,length:6.43,width:6.46,depth:3.96,table:57,depthPct:61.5 },
  { id:"DEMO-GIA-2529183",shape:"ROUND",carats:1.01,color:"E",clarity:"VVS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2529183005",price:9800,length:6.44,width:6.47,depth:3.97,table:56,depthPct:61.4 },
  { id:"DEMO-IGI-1038472",shape:"ROUND",carats:1.20,color:"F",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"IGI",certNumber:"1038472006",price:10500,length:6.85,width:6.88,depth:4.23,table:58,depthPct:61.7 },
  { id:"DEMO-GIA-2541097",shape:"ROUND",carats:1.30,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"2541097007",price:11800,length:6.97,width:7.00,depth:4.31,table:57,depthPct:61.8 },
  { id:"DEMO-GIA-2556384",shape:"ROUND",carats:1.50,color:"H",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2556384008",price:13500,length:7.36,width:7.39,depth:4.54,table:57,depthPct:61.6 },
  { id:"DEMO-GIA-2571849",shape:"ROUND",carats:1.51,color:"F",clarity:"VVS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2571849009",price:18900,length:7.37,width:7.40,depth:4.55,table:56,depthPct:61.5 },
  { id:"DEMO-IGI-1051293",shape:"ROUND",carats:1.70,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"Faint",lab:"IGI",certNumber:"1051293010",price:17600,length:7.65,width:7.68,depth:4.73,table:57,depthPct:61.7 },
  { id:"DEMO-GIA-2588274",shape:"ROUND",carats:2.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2588274011",price:27500,length:8.13,width:8.17,depth:5.03,table:58,depthPct:61.8 },
  { id:"DEMO-GIA-2594817",shape:"ROUND",carats:2.02,color:"E",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2594817012",price:38900,length:8.14,width:8.18,depth:5.04,table:57,depthPct:61.9 },
  { id:"DEMO-IGI-1064728",shape:"ROUND",carats:2.50,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"IGI",certNumber:"1064728013",price:35000,length:8.78,width:8.82,depth:5.42,table:57,depthPct:61.6 },
  { id:"DEMO-GIA-2607193",shape:"ROUND",carats:3.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2607193014",price:62500,length:9.31,width:9.35,depth:5.76,table:58,depthPct:61.8 },
  { id:"DEMO-HRD-001829",shape:"ROUND",carats:1.00,color:"D",clarity:"IF",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"HRD",certNumber:"001829015",price:15800,length:6.41,width:6.44,depth:3.96,table:55,depthPct:61.5 },
  { id:"DEMO-GIA-2619374",shape:"ROUND",carats:0.80,color:"I",clarity:"SI1",cut:"Very Good",polish:"Very Good",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"2619374016",price:2200,length:5.95,width:5.99,depth:3.69,table:59,depthPct:61.9 },
  { id:"DEMO-IGI-1072843",shape:"ROUND",carats:1.00,color:"J",clarity:"SI2",cut:"Very Good",polish:"Very Good",symmetry:"Good",fluorescence:"Medium",lab:"IGI",certNumber:"1072843017",price:3100,length:6.40,width:6.43,depth:3.97,table:60,depthPct:62.0 },
  { id:"DEMO-GIA-2631849",shape:"ROUND",carats:1.50,color:"D",clarity:"IF",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2631849018",price:38000,length:7.34,width:7.37,depth:4.53,table:55,depthPct:61.6 },
  { id:"DEMO-GIA-2648372",shape:"ROUND",carats:0.60,color:"E",clarity:"VVS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2648372019",price:2950,length:5.39,width:5.42,depth:3.33,table:56,depthPct:61.6 },
  { id:"DEMO-IGI-1083729",shape:"ROUND",carats:1.20,color:"H",clarity:"SI1",cut:"Very Good",polish:"Excellent",symmetry:"Very Good",fluorescence:"Faint",lab:"IGI",certNumber:"1083729020",price:6200,length:6.84,width:6.87,depth:4.23,table:59,depthPct:61.8 },

  // ── Oval (9) ─────────────────────────────────────────────────────────────
  { id:"DEMO-GIA-4201837",shape:"OVAL",carats:0.71,color:"F",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"4201837021",price:2500,length:7.10,width:5.08,depth:3.20,table:57,depthPct:63.0 },
  { id:"DEMO-GIA-4218394",shape:"OVAL",carats:1.01,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"4218394022",price:6800,length:8.00,width:5.60,depth:3.57,table:56,depthPct:63.8 },
  { id:"DEMO-GIA-4234871",shape:"OVAL",carats:1.51,color:"H",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"4234871023",price:11200,length:9.21,width:6.43,depth:4.08,table:57,depthPct:63.5 },
  { id:"DEMO-IGI-5018374",shape:"OVAL",carats:2.01,color:"F",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"Faint",lab:"IGI",certNumber:"5018374024",price:22000,length:10.32,width:7.24,depth:4.57,table:58,depthPct:63.2 },
  { id:"DEMO-GIA-4251938",shape:"OVAL",carats:0.90,color:"E",clarity:"VVS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"4251938025",price:6100,length:7.56,width:5.38,depth:3.38,table:55,depthPct:62.9 },
  { id:"DEMO-GIA-4267394",shape:"OVAL",carats:1.20,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"4267394026",price:8400,length:8.52,width:5.97,depth:3.79,table:57,depthPct:63.5 },
  { id:"DEMO-IGI-5031849",shape:"OVAL",carats:1.50,color:"I",clarity:"VS1",cut:"Excellent",polish:"Very Good",symmetry:"Very Good",fluorescence:"None",lab:"IGI",certNumber:"5031849027",price:9200,length:9.17,width:6.39,depth:4.07,table:59,depthPct:63.7 },
  { id:"DEMO-HRD-003847",shape:"OVAL",carats:3.00,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"HRD",certNumber:"003847028",price:55000,length:12.05,width:8.37,depth:5.30,table:56,depthPct:63.3 },
  { id:"DEMO-GIA-4283711",shape:"OVAL",carats:0.80,color:"H",clarity:"SI1",cut:"Very Good",polish:"Very Good",symmetry:"Very Good",fluorescence:"Faint",lab:"GIA",certNumber:"4283711029",price:2800,length:7.29,width:5.18,depth:3.28,table:60,depthPct:63.4 },

  // ── Cushion (7) ──────────────────────────────────────────────────────────
  { id:"DEMO-GIA-6103847",shape:"CUSHION",carats:1.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"6103847030",price:5900,length:6.40,width:6.23,depth:4.10,table:60,depthPct:64.2 },
  { id:"DEMO-GIA-6118394",shape:"CUSHION",carats:1.50,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"Faint",lab:"GIA",certNumber:"6118394031",price:10800,length:7.16,width:6.96,depth:4.60,table:62,depthPct:64.1 },
  { id:"DEMO-IGI-7021384",shape:"CUSHION",carats:2.02,color:"F",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"IGI",certNumber:"7021384032",price:21500,length:7.93,width:7.75,depth:5.12,table:61,depthPct:64.5 },
  { id:"DEMO-GIA-6134827",shape:"CUSHION",carats:0.80,color:"E",clarity:"VVS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"6134827033",price:5200,length:5.92,width:5.77,depth:3.80,table:59,depthPct:64.1 },
  { id:"DEMO-GIA-6149382",shape:"CUSHION",carats:1.20,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"6149382034",price:8100,length:6.73,width:6.55,depth:4.33,table:61,depthPct:64.3 },
  { id:"DEMO-IGI-7038491",shape:"CUSHION",carats:0.70,color:"H",clarity:"VS2",cut:"Very Good",polish:"Very Good",symmetry:"Very Good",fluorescence:"None",lab:"IGI",certNumber:"7038491035",price:2400,length:5.62,width:5.48,depth:3.62,table:62,depthPct:64.4 },
  { id:"DEMO-GIA-6163847",shape:"CUSHION",carats:1.71,color:"I",clarity:"VS2",cut:"Very Good",polish:"Very Good",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"6163847036",price:9800,length:7.38,width:7.19,depth:4.73,table:63,depthPct:64.3 },

  // ── Princess (5) ─────────────────────────────────────────────────────────
  { id:"DEMO-GIA-8201374",shape:"PRINCESS",carats:1.00,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"8201374037",price:5500,length:5.88,width:5.81,depth:4.18,table:69,depthPct:71.4 },
  { id:"DEMO-GIA-8217839",shape:"PRINCESS",carats:1.51,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"8217839038",price:9700,length:6.73,width:6.68,depth:4.83,table:68,depthPct:71.8 },
  { id:"DEMO-IGI-9031847",shape:"PRINCESS",carats:0.80,color:"F",clarity:"VVS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"IGI",certNumber:"9031847039",price:4600,length:5.44,width:5.38,depth:3.89,table:70,depthPct:71.5 },
  { id:"DEMO-GIA-8234193",shape:"PRINCESS",carats:2.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"Faint",lab:"GIA",certNumber:"8234193040",price:19000,length:7.60,width:7.52,depth:5.41,table:69,depthPct:71.2 },
  { id:"DEMO-GIA-8248374",shape:"PRINCESS",carats:1.20,color:"E",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"8248374041",price:10200,length:6.27,width:6.21,depth:4.49,table:70,depthPct:71.9 },

  // ── Pear (4) ─────────────────────────────────────────────────────────────
  { id:"DEMO-GIA-3104827",shape:"PEAR",carats:1.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"3104827042",price:6200,length:9.12,width:5.86,depth:3.70,table:57,depthPct:63.2 },
  { id:"DEMO-IGI-3501847",shape:"PEAR",carats:1.50,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"Faint",lab:"IGI",certNumber:"3501847043",price:10500,length:10.56,width:6.76,depth:4.27,table:58,depthPct:63.1 },
  { id:"DEMO-GIA-3121938",shape:"PEAR",carats:0.80,color:"F",clarity:"VVS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"3121938044",price:5100,length:8.12,width:5.20,depth:3.30,table:56,depthPct:63.5 },
  { id:"DEMO-GIA-3138274",shape:"PEAR",carats:2.01,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"3138274045",price:24000,length:11.83,width:7.57,depth:4.79,table:58,depthPct:63.3 },

  // ── Emerald (4) ──────────────────────────────────────────────────────────
  { id:"DEMO-GIA-5301847",shape:"EMERALD",carats:1.01,color:"F",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"5301847046",price:6400,length:7.18,width:5.22,depth:3.35,table:68,depthPct:64.2 },
  { id:"DEMO-GIA-5318394",shape:"EMERALD",carats:1.50,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"5318394047",price:11000,length:8.31,width:6.01,depth:3.87,table:69,depthPct:64.4 },
  { id:"DEMO-IGI-5601293",shape:"EMERALD",carats:2.01,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"Faint",lab:"IGI",certNumber:"5601293048",price:19500,length:9.24,width:6.69,depth:4.31,table:70,depthPct:64.5 },
  { id:"DEMO-HRD-008374",shape:"EMERALD",carats:0.90,color:"E",clarity:"VVS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"HRD",certNumber:"008374049",price:6800,length:6.98,width:5.04,depth:3.26,table:68,depthPct:64.7 },

  // ── Radiant (2) ──────────────────────────────────────────────────────────
  { id:"DEMO-GIA-7401837",shape:"RADIANT",carats:1.20,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"7401837050",price:7800,length:6.87,width:6.29,depth:4.41,table:66,depthPct:64.4 },
  { id:"DEMO-IGI-7601384",shape:"RADIANT",carats:1.81,color:"H",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"IGI",certNumber:"7601384051",price:15500,length:8.02,width:7.36,depth:5.15,table:67,depthPct:64.7 },

  // ── Marquise (2) ─────────────────────────────────────────────────────────
  { id:"DEMO-GIA-9201847",shape:"MARQUISE",carats:1.00,color:"F",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"9201847052",price:5800,length:10.84,width:5.56,depth:3.50,table:57,depthPct:63.1 },
  { id:"DEMO-GIA-9218394",shape:"MARQUISE",carats:1.51,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"Faint",lab:"GIA",certNumber:"9218394053",price:9900,length:12.59,width:6.46,depth:4.08,table:58,depthPct:63.2 },

  // ── Asscher (2) ──────────────────────────────────────────────────────────
  { id:"DEMO-GIA-1101837",shape:"ASSCHER",carats:1.01,color:"G",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"1101837054",price:5700,length:6.04,width:5.98,depth:4.05,table:66,depthPct:67.2 },
  { id:"DEMO-IGI-1201384",shape:"ASSCHER",carats:1.50,color:"H",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"IGI",certNumber:"1201384055",price:9400,length:6.91,width:6.84,depth:4.64,table:67,depthPct:67.4 },

  // ── Heart (2) ────────────────────────────────────────────────────────────
  { id:"DEMO-GIA-2901847",shape:"HEART",carats:1.01,color:"G",clarity:"VS2",cut:"Excellent",polish:"Excellent",symmetry:"Excellent",fluorescence:"None",lab:"GIA",certNumber:"2901847056",price:6100,length:6.51,width:6.78,depth:4.15,table:56,depthPct:61.7 },
  { id:"DEMO-GIA-2918374",shape:"HEART",carats:1.50,color:"F",clarity:"VS1",cut:"Excellent",polish:"Excellent",symmetry:"Very Good",fluorescence:"None",lab:"GIA",certNumber:"2918374057",price:12800,length:7.51,width:7.83,depth:4.80,table:57,depthPct:61.3 },
];

// ── Normalise raw → NivodaDiamond ─────────────────────────────────────────────

function toNivodaDiamond(r: RawDemo): NivodaDiamond {
  return {
    id: r.id,
    price: r.price,
    discount: null,
    supplierPrice: null,
    video: null,
    image: SHAPE_IMAGE[r.shape] ?? null,
    supplierStockId: null,
    certificate: {
      id: r.certNumber,
      lab: r.lab,
      shape: r.shape,
      certNumber: r.certNumber,
      cut: r.cut,
      carats: r.carats,
      clarity: r.clarity,
      polish: r.polish,
      symmetry: r.symmetry,
      fluorescence: r.fluorescence,
      color: r.color,
      length: r.length,
      width: r.width,
      depth: r.depth,
      table: r.table,
      depthPercentage: r.depthPct,
    },
  };
}

const DEMO_DIAMONDS: NivodaDiamond[] = RAW.map(toNivodaDiamond);

// ── Service functions ─────────────────────────────────────────────────────────

export async function searchDiamonds(filters: DiamondSearchFilters): Promise<SearchResult> {
  const {
    shapes,
    caratMin = 0.3,
    caratMax = 10,
    priceMin,
    priceMax,
    colors,
    clarities,
    cuts,
    labGrown,          // ignored in demo — no lab-grown distinction
    offset = 0,
    limit = 24,
    sortBy = "price",
    sortDir = "asc",
  } = filters;

  let items = DEMO_DIAMONDS.filter((d) => {
    const cert = d.certificate;
    if (shapes?.length) {
      const norm = shapes.map((s) => s.toUpperCase());
      if (!norm.includes(cert.shape.toUpperCase())) return false;
    }
    if (cert.carats < caratMin || cert.carats > caratMax) return false;
    if (priceMin != null && d.price < priceMin) return false;
    if (priceMax != null && d.price > priceMax) return false;
    if (colors?.length) {
      const norm = colors.map((c) => c.toUpperCase());
      if (!norm.includes(cert.color.toUpperCase())) return false;
    }
    if (clarities?.length) {
      const norm = clarities.map((c) => c.toUpperCase());
      if (!norm.includes(cert.clarity.toUpperCase())) return false;
    }
    if (cuts?.length) {
      const norm = cuts.map((c) => c.toLowerCase());
      if (!norm.includes((cert.cut ?? "").toLowerCase())) return false;
    }
    return true;
  });

  // Sort
  items.sort((a, b) => {
    let diff = 0;
    if (sortBy === "carat") {
      diff = a.certificate.carats - b.certificate.carats;
    } else {
      diff = a.price - b.price;
    }
    return sortDir === "desc" ? -diff : diff;
  });

  const totalCount = items.length;
  const page = items.slice(offset, offset + limit);

  return { items: page, totalCount, offset, limit };
}

export async function getDiamond(id: string): Promise<NivodaDiamond | null> {
  return DEMO_DIAMONDS.find((d) => d.id === id) ?? null;
}

export async function validateDiamond(id: string): Promise<{
  available: boolean;
  currentPrice: number | null;
  priceChanged: boolean;
  diamond: NivodaDiamond | null;
}> {
  const diamond = await getDiamond(id);
  if (!diamond) {
    return { available: false, currentPrice: null, priceChanged: false, diamond: null };
  }
  return { available: true, currentPrice: diamond.price, priceChanged: false, diamond };
}
