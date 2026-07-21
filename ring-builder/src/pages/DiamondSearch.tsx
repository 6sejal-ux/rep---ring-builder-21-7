import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSearchDiamonds, useGetPublicConfig } from "@workspace/api-client-react";
import { useBuilderStore } from "@/store/use-builder-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";

/** Local SVG representative images for each diamond shape. */
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

function diamondShapeImage(shape: string): string {
  return SHAPE_IMAGE[shape?.toUpperCase()] ?? '/media/diamonds/round.svg';
}

export default function DiamondSearch() {
  const [, setLocation] = useLocation();
  const setDiamond = useBuilderStore((state) => state.setDiamond);
  const { data: config } = useGetPublicConfig();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [shapes, setShapes] = useState<string[]>([]);
  const [caratRange, setCaratRange] = useState<[number, number]>([0.5, 5]);
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 50000]);
  const [colors, setColors] = useState<string[]>([]);
  const [clarities, setClarities] = useState<string[]>([]);
  const [labGrown, setLabGrown] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const limit = 24;

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { mutate: search, data: searchResults, isPending } = useSearchDiamonds();

  const colorOptions   = ["D", "E", "F", "G", "H", "I", "J", "K"];
  const clarityOptions = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"];

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      search({
        data: {
          shapes: shapes.length > 0 ? shapes : undefined,
          caratMin: caratRange[0],
          caratMax: caratRange[1] === 5 ? undefined : caratRange[1],
          priceMin: priceRange[0],
          priceMax: priceRange[1] === 50000 ? undefined : priceRange[1],
          colors:    colors.length > 0    ? colors    : undefined,
          clarities: clarities.length > 0 ? clarities : undefined,
          labGrown,
          offset: (page - 1) * limit,
          limit,
          sortBy:  "price",
          sortDir: "asc",
        },
      });
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [shapes, caratRange, priceRange, colors, clarities, labGrown, page, search]);

  const toggleShape   = (s: string) => { setShapes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); setPage(1); };
  const toggleColor   = (c: string) => { setColors(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); setPage(1); };
  const toggleClarity = (c: string) => { setClarities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); setPage(1); };

  const clearFilters = () => {
    setShapes([]); setCaratRange([0.5, 5]); setPriceRange([500, 50000]);
    setColors([]); setClarities([]); setPage(1);
  };

  const activeFilterCount = useMemo(() =>
    shapes.length + colors.length + clarities.length +
    (caratRange[0] !== 0.5 || caratRange[1] !== 5 ? 1 : 0) +
    (priceRange[0] !== 500 || priceRange[1] !== 50000 ? 1 : 0),
    [shapes, colors, clarities, caratRange, priceRange]
  );

  const selectDiamond = (diamond: any) => {
    const cert = diamond.certificate;
    setDiamond({
      id:          diamond.id,
      shape:       cert.shape,
      carat:       cert.carats,
      color:       cert.color,
      clarity:     cert.clarity,
      cut:         cert.cut         ?? undefined,
      polish:      cert.polish      ?? undefined,
      symmetry:    cert.symmetry    ?? undefined,
      fluorescence:(cert as any).fluorescence ?? undefined,
      price:       diamond.price,
      image:       diamond.image ?? diamondShapeImage(cert.shape),
      video:       diamond.video   ?? undefined,
      certificate: cert.certNumber ?? undefined,
      lab:         cert.lab        ?? undefined,
      length:      cert.length     ?? undefined,
      width:       cert.width      ?? undefined,
      depth:       cert.depth      ?? undefined,
    });
    setLocation(`/diamond/${diamond.id}`);
  };

  // ── Sidebar filters (shared between desktop and mobile drawer) ────────────
  const FiltersContent = (
    <div className="p-6 lg:p-8 space-y-10">
      <div className="flex justify-between items-center lg:hidden mb-4">
        <h2 className="font-serif text-2xl text-primary">Filters</h2>
        <button onClick={() => setIsMobileFiltersOpen(false)} aria-label="Close filters">
          <X className="text-primary" />
        </button>
      </div>

      {/* Origin */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-widest text-xs font-bold text-primary">Origin</span>
          <span className="font-serif italic text-muted-foreground">{labGrown ? 'Lab Grown' : 'Natural'}</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/20 p-2 border border-border">
          <Button
            variant={labGrown ? "default" : "ghost"}
            className={`flex-1 rounded-none h-10 ${labGrown ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-transparent'}`}
            onClick={() => { setLabGrown(true); setPage(1); }}
          >Lab Grown</Button>
          <Button
            variant={!labGrown ? "default" : "ghost"}
            className={`flex-1 rounded-none h-10 ${!labGrown ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-transparent'}`}
            onClick={() => { setLabGrown(false); setPage(1); }}
          >Natural</Button>
        </div>
      </div>

      {/* Shape */}
      <div className="space-y-4">
        <span className="uppercase tracking-widest text-xs font-bold text-primary block">Shape</span>
        <div className="grid grid-cols-3 gap-2">
          {config?.shapes.map(s => (
            <button
              key={s.nivodaKey}
              onClick={() => toggleShape(s.nivodaKey)}
              className={`py-2 px-1 text-[10px] uppercase tracking-wider border transition-colors ${
                shapes.includes(s.nivodaKey)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Carat */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="uppercase tracking-widest text-xs font-bold text-primary">Carat</span>
          <span className="text-xs text-primary font-sans">{caratRange[0]} – {caratRange[1] === 5 ? '5.0+' : caratRange[1]} ct</span>
        </div>
        <Slider
          defaultValue={[0.5, 5]} min={0.1} max={5} step={0.1}
          value={caratRange}
          onValueChange={(v) => { setCaratRange(v as [number, number]); setPage(1); }}
        />
      </div>

      {/* Price */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="uppercase tracking-widest text-xs font-bold text-primary">Price (AUD)</span>
          <span className="text-xs text-primary font-sans">${priceRange[0].toLocaleString()} – ${priceRange[1] === 50000 ? '50k+' : priceRange[1].toLocaleString()}</span>
        </div>
        <Slider
          defaultValue={[500, 50000]} min={0} max={50000} step={500}
          value={priceRange}
          onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
        />
      </div>

      {/* Color */}
      <div className="space-y-4">
        <span className="uppercase tracking-widest text-xs font-bold text-primary block">Colour</span>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(c => (
            <button key={c} onClick={() => toggleColor(c)}
              className={`w-10 h-10 border text-xs font-serif transition-colors ${
                colors.includes(c) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Clarity */}
      <div className="space-y-4">
        <span className="uppercase tracking-widest text-xs font-bold text-primary block">Clarity</span>
        <div className="flex flex-wrap gap-2">
          {clarityOptions.map(c => (
            <button key={c} onClick={() => toggleClarity(c)}
              className={`px-3 h-10 border text-xs tracking-wider transition-colors ${
                clarities.includes(c) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters}
          className="w-full text-xs uppercase tracking-widest text-muted-foreground border border-border py-3 hover:border-primary hover:text-primary transition-colors"
        >Clear All Filters ({activeFilterCount})</button>
      )}
    </div>
  );

  // ── Diamond card ──────────────────────────────────────────────────────────
  const DiamondCard = ({ d }: { d: any }) => {
    const cert = d.certificate;
    const shape = cert.shape ?? '';
    const imgSrc = d.image ?? diamondShapeImage(shape);

    return (
      <div className="group flex flex-col bg-white border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square bg-[#f9f8f6] border-b border-border flex items-center justify-center p-6">
          <img
            src={imgSrc}
            alt={shape}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Shape + Lab */}
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-xl text-primary capitalize leading-tight">{shape.toLowerCase()}</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 font-sans shrink-0 ml-2">
              {cert.lab}
            </span>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-sans">
            <div className="text-muted-foreground uppercase tracking-wider">Carat</div>
            <div className="text-primary font-medium">{cert.carats.toFixed(2)} ct</div>

            <div className="text-muted-foreground uppercase tracking-wider">Colour</div>
            <div className="text-primary font-medium">{cert.color}</div>

            <div className="text-muted-foreground uppercase tracking-wider">Clarity</div>
            <div className="text-primary font-medium">{cert.clarity}</div>

            {cert.cut && (
              <>
                <div className="text-muted-foreground uppercase tracking-wider">Cut</div>
                <div className="text-primary font-medium">{cert.cut}</div>
              </>
            )}

            {cert.length && cert.width && (
              <>
                <div className="text-muted-foreground uppercase tracking-wider">Size</div>
                <div className="text-primary font-medium">
                  {cert.length.toFixed(2)} × {cert.width.toFixed(2)} mm
                </div>
              </>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-3">
            <span className="font-serif text-lg text-primary tracking-wide">
              ${d.price.toLocaleString()} <span className="text-xs font-sans text-muted-foreground">AUD</span>
            </span>
            <Button
              onClick={() => selectDiamond(d)}
              className="rounded-none h-9 px-4 text-xs uppercase tracking-widest font-sans bg-primary text-primary-foreground hover:bg-primary/85 shrink-0"
            >
              Select
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row h-full border-t border-border">

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden p-4 border-b border-border bg-white flex justify-between items-center sticky top-20 z-40">
          <Button
            variant="outline"
            className="rounded-none font-serif tracking-wide border-primary text-primary"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
          <span className="font-serif text-muted-foreground">
            {searchResults?.totalCount?.toLocaleString() ?? 0} Diamonds
          </span>
        </div>

        {/* Desktop Sidebar / Mobile Drawer */}
        <div className={`fixed inset-0 z-50 bg-white lg:static lg:w-[300px] lg:border-r lg:border-border lg:block overflow-y-auto ${isMobileFiltersOpen ? 'block' : 'hidden'}`}>
          {FiltersContent}
          {/* Mobile "View results" sticky footer */}
          <div className="p-6 border-t border-border bg-[#fbfbfb] sticky bottom-0 lg:hidden">
            <Button
              className="w-full rounded-none h-14 font-serif text-lg tracking-wide"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              View {searchResults?.totalCount?.toLocaleString() ?? 0} Diamonds
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 bg-white flex flex-col min-h-0">
          {/* Header */}
          <div className="p-5 border-b border-border hidden lg:flex justify-between items-center bg-[#fbfbfb]">
            <h1 className="text-2xl font-serif text-primary tracking-wide">Choose Your Diamond</h1>
            <span className="font-sans text-sm text-muted-foreground uppercase tracking-widest">
              {isPending ? 'Searching…' : `${searchResults?.totalCount?.toLocaleString() ?? 0} Diamonds Found`}
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 lg:p-6 bg-white">
            {/* Loading skeletons */}
            {isPending && !searchResults && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="border border-border">
                    <Skeleton className="w-full aspect-square bg-muted/20" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-2/3 bg-muted/20" />
                      <Skeleton className="h-4 w-full bg-muted/20" />
                      <Skeleton className="h-4 w-3/4 bg-muted/20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isPending && searchResults?.items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-24">
                <h3 className="text-2xl font-serif text-primary mb-2">No diamonds found</h3>
                <p className="text-muted-foreground font-sans max-w-md mb-8">
                  Try expanding your search criteria. Diamonds matching those exact parameters may be temporarily unavailable.
                </p>
                <Button
                  variant="outline"
                  className="rounded-none border-primary text-primary"
                  onClick={clearFilters}
                >Reset Filters</Button>
              </div>
            )}

            {/* Diamond grid */}
            {searchResults && searchResults.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.items.map(d => (
                    <DiamondCard key={d.id} d={d} />
                  ))}
                </div>

                {/* Pagination */}
                {searchResults.totalCount > limit && (
                  <div className="flex items-center justify-between border-t border-border mt-8 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-none font-serif tracking-wide border-border"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                      Page {page} of {Math.ceil(searchResults.totalCount / limit)}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(searchResults.totalCount / limit)}
                      className="rounded-none font-serif tracking-wide border-border"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
