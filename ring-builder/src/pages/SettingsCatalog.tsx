import { useState, useMemo, useCallback, useRef, Fragment } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListSettings, useGetPublicConfig } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCatalogPreviewImage, getCatalogHoverImage } from "@/lib/setting-media";

// ── Classification filter options (from CSV) ──────────────────────────────────

const SETTING_TYPES = ["Solitaire", "Halo", "Hidden Halo", "Toi Et Moi", "Unique", "Bezel", "Pavé"];
const SETTING_HEIGHTS = ["High Set", "Low Set"];
const BAND_TYPES = ["Accents", "Plain", "Twisted", "Side Stone"];

const METAL_OPTIONS = [
  { karat: "9K",  tone: "White",  color: "linear-gradient(135deg,#e8e8e8,#c8c8c8)", toneKey: "White Gold" },
  { karat: "14K", tone: "White",  color: "linear-gradient(135deg,#e4e4e4,#c0c0c0)", toneKey: "White Gold" },
  { karat: "18K", tone: "White",  color: "linear-gradient(135deg,#dcdcdc,#b8b8b8)", toneKey: "White Gold" },
  { karat: "9K",  tone: "Yellow", color: "linear-gradient(135deg,#f7e09a,#c9a44f)", toneKey: "Yellow Gold" },
  { karat: "14K", tone: "Yellow", color: "linear-gradient(135deg,#f5d68e,#c9a44f)", toneKey: "Yellow Gold" },
  { karat: "18K", tone: "Yellow", color: "linear-gradient(135deg,#f0c96e,#b8902a)", toneKey: "Yellow Gold" },
  { karat: "9K",  tone: "Rose",   color: "linear-gradient(135deg,#f0c4b0,#d4896a)", toneKey: "Rose Gold" },
];

const TONE_DOT_COLORS: Record<string, string> = {
  yellow: "#C9A44F",
  rose:   "#C8916A",
  white:  "#C8C8C8",
  platinum: "#A8A8B8",
};

// Position in the product grid to insert the promo card (0-based, before product at this index)
const PROMO_INSERT_BEFORE = 3;

function variantTone(metal: string): string {
  const m = metal.toLowerCase();
  if (m.includes("yellow"))   return "yellow";
  if (m.includes("rose"))     return "rose";
  if (m.includes("platinum")) return "platinum";
  return "white";
}

// ── Promo card ────────────────────────────────────────────────────────────────

function PromoCard() {
  return (
    <div className="relative overflow-hidden bg-black flex flex-col cursor-default select-none">
      {/* 1:1 square image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src="/promo-afterpay.png"
          alt="Buy Now Pay Later with Afterpay — Don't break the saving."
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

// ── Scrollable chip strip with left/right arrows ──────────────────────────────

function ChipStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };
  return (
    <div className={cn("relative flex items-center", className)}>
      <button
        onClick={() => scroll(-1)}
        className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border border-border bg-white text-primary hover:border-primary/40 transition-colors z-10"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 scroll-smooth flex-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        className="hidden sm:flex shrink-0 w-7 h-7 items-center justify-center border border-border bg-white text-primary hover:border-primary/40 transition-colors z-10"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Setting Type thumbnail chip ───────────────────────────────────────────────

function TypeChip({
  label,
  imageUrl,
  selected,
  onClick,
}: {
  label: string;
  imageUrl: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group transition-all",
        selected ? "opacity-100" : "opacity-70 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 border-2 overflow-hidden bg-[#f8f7f5] transition-all",
          selected ? "border-primary" : "border-border group-hover:border-primary/40",
        )}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-2xl font-serif">◇</div>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-sans uppercase tracking-wider leading-none whitespace-nowrap",
          selected ? "text-primary font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

// ── Pill chip ─────────────────────────────────────────────────────────────────

function PillChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 text-[11px] font-sans uppercase tracking-widest border whitespace-nowrap transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-white",
      )}
    >
      {label}
    </button>
  );
}

// ── Shape icon chip ───────────────────────────────────────────────────────────

const SHAPE_ICONS: Record<string, string> = {
  Round: "⬤",
  Princess: "◼",
  Cushion: "⬛",
  Oval: "⬭",
  Emerald: "▬",
  Pear: "🔻",
  Radiant: "◈",
  Asscher: "◪",
  Marquise: "◇",
  Heart: "♥",
};

function ShapeChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 shrink-0 px-3 py-2 border transition-all",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-white",
      )}
    >
      <span className="text-base leading-none">{SHAPE_ICONS[label] ?? "◇"}</span>
      <span className="text-[10px] font-sans uppercase tracking-wider whitespace-nowrap">{label}</span>
    </button>
  );
}

// ── Metal swatch chip ─────────────────────────────────────────────────────────

function MetalChip({
  karat,
  tone,
  color,
  selected,
  onClick,
}: {
  karat: string;
  tone: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 shrink-0 group transition-all",
        selected ? "opacity-100" : "opacity-70 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border group-hover:border-primary/40",
        )}
        style={{ background: color }}
      >
        <div className="text-center leading-none">
          <div className="text-[8px] font-bold text-white drop-shadow" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
            {karat}
          </div>
          <div className="text-[6px] font-semibold text-white drop-shadow uppercase" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
            {tone.substring(0, 3)}
          </div>
        </div>
      </div>
      <span
        className={cn(
          "text-[9px] font-sans uppercase tracking-wider leading-none whitespace-nowrap",
          selected ? "text-primary font-semibold" : "text-muted-foreground",
        )}
      >
        {karat} {tone}
      </span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsCatalog() {
  const { data: config } = useGetPublicConfig();
  const { data: allData, isLoading } = useListSettings({ pageSize: 250 } as any);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [settingTypeFilter,   setSettingTypeFilter]   = useState("");
  const [settingHeightFilter, setSettingHeightFilter] = useState("");
  const [bandTypeFilter,      setBandTypeFilter]      = useState("");
  const [shapeFilters,        setShapeFilters]        = useState<string[]>([]);
  const [metalFilter,         setMetalFilter]         = useState<{ karat: string; tone: string } | null>(null);
  const [priceRange,          setPriceRange]          = useState<[number, number]>([0, 10000]);
  const [sort,                setSort]                = useState("price-asc");
  const [mobileOpen,          setMobileOpen]          = useState(false);

  const toggleShape = useCallback((shape: string) => {
    setShapeFilters((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape],
    );
  }, []);

  const clearAll = () => {
    setSettingTypeFilter("");
    setSettingHeightFilter("");
    setBandTypeFilter("");
    setShapeFilters([]);
    setMetalFilter(null);
    setPriceRange([0, 10000]);
  };

  // Active filter count
  const activeCount =
    (settingTypeFilter ? 1 : 0) +
    (settingHeightFilter ? 1 : 0) +
    (bandTypeFilter ? 1 : 0) +
    shapeFilters.length +
    (metalFilter ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  // ── Compute representative images per setting type ────────────────────────
  const typeImages = useMemo<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    if (!allData?.items) return map;
    for (const type of SETTING_TYPES) {
      const match = allData.items.find((s: any) => s.settingType === type);
      map[type] = match ? getCatalogPreviewImage(match.images) : null;
    }
    return map;
  }, [allData]);

  // ── Client-side filter + sort ─────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!allData?.items) return [];
    return allData.items
      .filter((s: any) => {
        if (settingTypeFilter && s.settingType !== settingTypeFilter) return false;
        if (settingHeightFilter && s.settingHeight !== settingHeightFilter) return false;
        if (bandTypeFilter && s.bandType !== bandTypeFilter) return false;
        if (shapeFilters.length > 0 && !s.variants.some((v: any) => shapeFilters.includes(v.shape))) return false;
        if (metalFilter) {
          const { karat, tone } = metalFilter;
          if (!s.variants.some((v: any) => v.metal.toLowerCase().includes(karat.toLowerCase()) && v.metal.toLowerCase().includes(tone.toLowerCase()))) return false;
        }
        const minP = Math.min(...s.variants.map((v: any) => v.price));
        if (priceRange[0] > 0 && minP < priceRange[0]) return false;
        if (priceRange[1] < 10000 && minP > priceRange[1]) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        const pa = Math.min(...a.variants.map((v: any) => v.price));
        const pb = Math.min(...b.variants.map((v: any) => v.price));
        if (sort === "price-desc") return pb - pa;
        if (sort === "name-asc") return a.title.localeCompare(b.title);
        return pa - pb;
      });
  }, [allData, settingTypeFilter, settingHeightFilter, bandTypeFilter, shapeFilters, metalFilter, priceRange, sort]);

  const allShapes = config?.shapes ?? [];

  // ── Filter panel content ──────────────────────────────────────────────────
  const FilterPanelContent = () => (
    <div className="space-y-6">
      {/* Setting Type */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3 flex items-center gap-2">
          Setting Type
          {settingTypeFilter && (
            <button onClick={() => setSettingTypeFilter("")} className="text-muted-foreground hover:text-primary">
              <X className="w-3 h-3" />
            </button>
          )}
        </p>
        <ChipStrip>
          {SETTING_TYPES.map((type) => (
            <TypeChip
              key={type}
              label={type}
              imageUrl={typeImages[type] ?? null}
              selected={settingTypeFilter === type}
              onClick={() => setSettingTypeFilter(settingTypeFilter === type ? "" : type)}
            />
          ))}
        </ChipStrip>
      </div>

      {/* Setting Height + Band Type side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3 flex items-center gap-2">
            Setting Height
            {settingHeightFilter && (
              <button onClick={() => setSettingHeightFilter("")} className="text-muted-foreground hover:text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {SETTING_HEIGHTS.map((h) => (
              <PillChip
                key={h}
                label={h}
                selected={settingHeightFilter === h}
                onClick={() => setSettingHeightFilter(settingHeightFilter === h ? "" : h)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3 flex items-center gap-2">
            Band Type
            {bandTypeFilter && (
              <button onClick={() => setBandTypeFilter("")} className="text-muted-foreground hover:text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {BAND_TYPES.map((b) => (
              <PillChip
                key={b}
                label={b}
                selected={bandTypeFilter === b}
                onClick={() => setBandTypeFilter(bandTypeFilter === b ? "" : b)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Shape + Metal side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3 flex items-center gap-2">
            Shape
            {shapeFilters.length > 0 && (
              <button onClick={() => setShapeFilters([])} className="text-muted-foreground hover:text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </p>
          <ChipStrip>
            {allShapes.map((s) => (
              <ShapeChip
                key={s.label}
                label={s.label}
                selected={shapeFilters.includes(s.label)}
                onClick={() => toggleShape(s.label)}
              />
            ))}
          </ChipStrip>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3 flex items-center gap-2">
            Metal
            {metalFilter && (
              <button onClick={() => setMetalFilter(null)} className="text-muted-foreground hover:text-primary">
                <X className="w-3 h-3" />
              </button>
            )}
          </p>
          <ChipStrip>
            {METAL_OPTIONS.map((m) => (
              <MetalChip
                key={`${m.karat}-${m.tone}`}
                karat={m.karat}
                tone={m.tone}
                color={m.color}
                selected={metalFilter?.karat === m.karat && metalFilter?.tone === m.tone}
                onClick={() =>
                  setMetalFilter(
                    metalFilter?.karat === m.karat && metalFilter?.tone === m.tone
                      ? null
                      : { karat: m.karat, tone: m.tone },
                  )
                }
              />
            ))}
          </ChipStrip>
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3">
          Price Range
          {(priceRange[0] > 0 || priceRange[1] < 10000) && (
            <button
              onClick={() => setPriceRange([0, 10000])}
              className="ml-2 text-muted-foreground hover:text-primary inline-flex"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </p>
        <div className="px-1 space-y-2">
          <Slider
            value={priceRange}
            min={0}
            max={10000}
            step={50}
            onValueChange={(v) => setPriceRange(v as [number, number])}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-sans">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>{priceRange[1] >= 10000 ? "$10k+" : `$${priceRange[1].toLocaleString()}`}</span>
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 border border-border text-xs text-primary font-sans py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors uppercase tracking-widest"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Page header */}
      <div className="bg-white border-b border-border py-10 px-4">
        <div className="container mx-auto max-w-screen-xl text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3">
            Step 1 of 3
          </p>
          <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide mb-3">
            Choose Your Setting
          </h1>
          <p className="text-muted-foreground font-sans max-w-md mx-auto text-sm leading-relaxed">
            Select a masterfully crafted ring setting from our collection.
          </p>
        </div>
      </div>

      {/* Desktop filter bar */}
      <div className="hidden lg:block border-b border-border bg-white">
        <div className="container mx-auto max-w-screen-xl px-4 py-5">
          <FilterPanelContent />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-screen-xl py-6 flex-1">
        {/* Controls bar */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6 flex-wrap">
          {/* Left: count + active chips */}
          <div className="flex items-center gap-2 flex-wrap min-h-[34px]">
            {!isLoading && (
              <span className="text-xs text-muted-foreground font-sans">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "setting" : "settings"}
              </span>
            )}
            {settingTypeFilter && (
              <button onClick={() => setSettingTypeFilter("")} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                {settingTypeFilter} <X className="w-3 h-3" />
              </button>
            )}
            {settingHeightFilter && (
              <button onClick={() => setSettingHeightFilter("")} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                {settingHeightFilter} <X className="w-3 h-3" />
              </button>
            )}
            {bandTypeFilter && (
              <button onClick={() => setBandTypeFilter("")} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                {bandTypeFilter} <X className="w-3 h-3" />
              </button>
            )}
            {shapeFilters.map((s) => (
              <button key={s} onClick={() => toggleShape(s)} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                {s} <X className="w-3 h-3" />
              </button>
            ))}
            {metalFilter && (
              <button onClick={() => setMetalFilter(null)} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                {metalFilter.karat} {metalFilter.tone} <X className="w-3 h-3" />
              </button>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <button onClick={() => setPriceRange([0, 10000])} className="flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/5 text-primary px-2.5 py-1 hover:bg-primary/10">
                ${priceRange[0]}–{priceRange[1] >= 10000 ? "10k+" : `$${priceRange[1]}`} <X className="w-3 h-3" />
              </button>
            )}
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2">
                Clear all
              </button>
            )}
          </div>

          {/* Right: sort + mobile filter trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-sans border border-border bg-white text-primary px-3 h-9 focus:outline-none focus:border-primary/50"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A – Z</option>
            </select>

            {/* Mobile filter sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden flex items-center gap-2 border border-border bg-white text-primary px-3 h-9 text-xs uppercase tracking-wider font-sans hover:border-primary/40 transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeCount > 0 && (
                    <span className="bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none">
                      {activeCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-serif text-xl tracking-wide">Filter Settings</SheetTitle>
                </SheetHeader>
                <FilterPanelContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-square rounded-none bg-muted/30" />
                <Skeleton className="h-4 w-3/4 bg-muted/20" />
                <Skeleton className="h-3 w-1/3 bg-muted/20" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl text-muted-foreground/20 font-serif mb-6 select-none">◇</div>
            <h3 className="text-2xl font-serif text-primary mb-3">No settings found</h3>
            <p className="text-muted-foreground font-sans text-sm max-w-xs mx-auto mb-8 leading-relaxed">
              Try adjusting your filters to discover more options.
            </p>
            <button
              onClick={clearAll}
              className="border border-primary text-primary text-xs uppercase tracking-widest font-sans px-8 py-3 hover:bg-primary hover:text-white transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredItems.flatMap((setting: any, idx: number) => {
              const primaryImg = getCatalogPreviewImage(setting.images);
              const hoverImg   = getCatalogHoverImage(setting.images, primaryImg);
              const minPrice   = Math.min(...setting.variants.map((v: any) => v.price));
              const tones = [...new Set(setting.variants.map((v: any) => variantTone(v.metal)))] as string[];
              const subtitle = [setting.settingType, setting.bandType].filter(Boolean).join(", ");

              const card = (
                <Link
                  key={setting.handle}
                  href={`/setting/${setting.handle}`}
                  className="group flex flex-col bg-white border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-500 cursor-pointer"
                >
                  {/* Image — strict 1:1 square */}
                  <div className="relative aspect-square overflow-hidden bg-[#f8f7f5]">
                    {/* Placeholder diamond */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/15 text-4xl font-serif pointer-events-none select-none">◇</div>

                    {/* Primary image */}
                    {primaryImg && (
                      <img
                        src={primaryImg}
                        alt={setting.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-700 group-hover:opacity-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    {/* Hover image */}
                    {hoverImg && (
                      <img
                        src={hoverImg}
                        alt={setting.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    {/* Metal tone dots */}
                    <div className="absolute bottom-2.5 left-3 flex gap-1.5">
                      {tones.map((tone) => (
                        <div
                          key={tone}
                          className="w-2.5 h-2.5 rounded-full border border-white/70 shadow"
                          style={{ background: TONE_DOT_COLORS[tone] ?? "#C8C8C8" }}
                        />
                      ))}
                    </div>

                    {/* Setting type badge (visible on hover) */}
                    {setting.settingType && (
                      <div className="absolute top-2.5 right-2.5 bg-white/90 border border-border text-[9px] uppercase tracking-widest text-primary px-2 py-0.5 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                        {setting.settingType}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3 md:p-4 flex flex-col gap-1 border-t border-border">
                    <h3 className="font-serif text-sm md:text-base text-primary leading-snug line-clamp-2">
                      {setting.title}
                    </h3>
                    {subtitle && (
                      <p className="text-[11px] text-muted-foreground font-sans leading-snug">
                        {subtitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      From{" "}
                      <span className="text-primary font-medium">
                        ${minPrice.toLocaleString()} AUD
                      </span>
                    </p>
                  </div>
                </Link>
              );

              // Inject promo card before the product at PROMO_INSERT_BEFORE index
              if (idx === PROMO_INSERT_BEFORE) {
                return [<PromoCard key="__promo__" />, card];
              }

              return [card];
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
