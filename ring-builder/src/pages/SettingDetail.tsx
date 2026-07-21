import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetSetting, useGetPublicConfig } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/use-builder-store";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Play,
  AlertCircle,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  ShieldCheck,
  Truck,
  Gem,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { metalColor } from "@/lib/metal-colors";
import {
  buildGallery,
  resolveStaticImage,
  getMetalTone,
  type MetalTone,
} from "@/lib/setting-media";
import { cn } from "@/lib/utils";
import { TRUST_BADGES, POLICY_ACCORDIONS } from "@/config/policies";

// ── Prong type options ────────────────────────────────────────────────────────

const PRONG_TYPES = [
  { value: "4-Prong", label: "4 Prong", description: "Classic & secure" },
  { value: "6-Prong", label: "6 Prong", description: "Extra secure" },
  { value: "Claw",    label: "Claw",    description: "Shows more diamond" },
  { value: "V-Prong", label: "V Prong", description: "Ideal for pointed shapes" },
];

// ── Engraving validation ──────────────────────────────────────────────────────

function sanitizeEngraving(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 6);
}

// ── Touch swipe hook ──────────────────────────────────────────────────────────

function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => { startX.current = e.clientX; },
    onPointerUp: (e: React.PointerEvent) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 40) dx < 0 ? onLeft() : onRight();
      startX.current = null;
    },
  };
}

// ── Bold-text renderer (** → <strong>) ───────────────────────────────────────

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Trust badge icon resolver ─────────────────────────────────────────────────

function TrustIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "shield-check":  return <ShieldCheck  className="w-5 h-5 shrink-0 text-primary/60" />;
    case "truck":         return <Truck         className="w-5 h-5 shrink-0 text-primary/60" />;
    case "gem":           return <Gem           className="w-5 h-5 shrink-0 text-primary/60" />;
    default:              return <ShieldCheck   className="w-5 h-5 shrink-0 text-primary/60" />;
  }
}

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ title, bullets }: { title: string; bullets: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left group"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary group-hover:text-primary/70 transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 pb-4" : "max-h-0",
        )}
      >
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 items-start text-sm text-muted-foreground font-sans leading-relaxed">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 shrink-0" />
              <BoldText text={b} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({ shareUrl, title }: { shareUrl: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      setOpen((o) => !o);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I found this ring setting at Southern Star Diamonds:\n\n${shareUrl}`)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-sans uppercase tracking-wider py-1"
        aria-label="Share this setting"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white border border-border shadow-lg py-1">
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-primary hover:bg-muted/40 transition-colors font-sans"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={emailHref}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-primary hover:bg-muted/40 transition-colors font-sans"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-primary hover:bg-muted/40 transition-colors font-sans"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [, setLocation] = useLocation();
  const setSetting = useBuilderStore((state) => state.setSetting);
  const existingDiamond = useBuilderStore((state) => state.diamond);

  const { data: config } = useGetPublicConfig();
  const { data: setting, isLoading, isError } = useGetSetting(handle ?? "");

  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [selectedMetal,   setSelectedMetal]   = useState<string>("");
  const [selectedShape,   setSelectedShape]   = useState<string>("");
  const [ringSize,        setRingSize]        = useState<string>("");
  const [engraving,       setEngraving]       = useState<string>("");
  const [prongType,       setProngType]       = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialise defaults once setting loads
  useEffect(() => {
    if (!setting || setting.variants.length === 0) return;
    if (!selectedMetal) {
      const yellowVariant =
        setting.variants.find((v) => v.metal === "9K Yellow Gold") ??
        setting.variants.find((v) => v.metal.toLowerCase().includes("yellow gold")) ??
        setting.variants[0];
      setSelectedMetal(yellowVariant.metal);
      if (!selectedShape) setSelectedShape(yellowVariant.shape);
    }
  }, [setting, selectedMetal, selectedShape]);

  const metalTone: MetalTone = useMemo(() => getMetalTone(selectedMetal), [selectedMetal]);

  const activeVariant = useMemo(() => {
    if (!setting) return null;
    return (
      setting.variants.find((v) => v.metal === selectedMetal && v.shape === selectedShape) ??
      setting.variants[0]
    );
  }, [setting, selectedMetal, selectedShape]);

  const availableMetals = useMemo(() => {
    if (!setting) return [];
    return [...new Set(setting.variants.map((v) => v.metal))];
  }, [setting]);

  const availableShapesForMetal = useMemo(() => {
    if (!setting || !selectedMetal) return [];
    return [...new Set(setting.variants.filter((v) => v.metal === selectedMetal).map((v) => v.shape))];
  }, [setting, selectedMetal]);

  // Gallery
  const galleryItems = useMemo(() => {
    if (!setting) return [];
    return buildGallery(setting.images, selectedShape, metalTone, setting.variants);
  }, [setting, selectedShape, metalTone]);

  // Reset gallery index when shape/metal changes
  useEffect(() => { setSelectedItemIdx(0); }, [selectedShape, metalTone]);

  const selectedItem = galleryItems[selectedItemIdx] ?? galleryItems[0] ?? null;

  // Navigation
  const goNext = useCallback(() => {
    setSelectedItemIdx((i) => (i + 1) % Math.max(galleryItems.length, 1));
  }, [galleryItems.length]);

  const goPrev = useCallback(() => {
    setSelectedItemIdx((i) => (i - 1 + Math.max(galleryItems.length, 1)) % Math.max(galleryItems.length, 1));
  }, [galleryItems.length]);

  const swipeHandlers = useSwipe(goNext, goPrev);

  const resolvedStaticImage = useMemo(() => {
    if (!setting) return null;
    return resolveStaticImage(setting.images, selectedShape, metalTone);
  }, [setting, selectedShape, metalTone]);

  // Share URL — encodes setting, shape, metal (no sensitive data)
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/setting/${handle}`;
    const params = new URLSearchParams();
    if (selectedShape) params.set("shape", selectedShape);
    if (selectedMetal) params.set("metal", selectedMetal);
    return `${base}?${params.toString()}`;
  }, [handle, selectedShape, selectedMetal]);

  // Validation + submit
  const handleSelectSetting = () => {
    const errors: string[] = [];
    if (!selectedMetal) errors.push("Please select a metal.");
    if (!selectedShape) errors.push("Please select a diamond shape.");
    if (!prongType) errors.push("Please select a prong type.");
    if (!ringSize) errors.push("Please select your ring size.");
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    if (!setting || !activeVariant) return;
    setSetting({
      handle: setting.handle,
      title: setting.title,
      variantTitle: `${activeVariant.shape} ${activeVariant.metal}`,
      sku: activeVariant.sku,
      metal: activeVariant.metal,
      shape: activeVariant.shape,
      price: activeVariant.price,
      image: resolvedStaticImage ?? activeVariant.image ?? setting.images[0],
      ringSize,
      engraving,
      prongType,
    });

    if (existingDiamond) setLocation("/review");
    else setLocation("/diamond");
  };

  // ── Loading / error ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <Skeleton className="w-full aspect-square rounded-none" />
              <div className="flex gap-3">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="w-16 h-16 rounded-none" />)}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="w-3/4 h-10 rounded-none" />
              <Skeleton className="w-1/4 h-8 rounded-none" />
              <Skeleton className="w-full h-40 rounded-none" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !setting) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-serif mb-4">Setting Not Found</h2>
          <Button onClick={() => setLocation("/setting")}>Return to Catalog</Button>
        </div>
      </AppLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <AppLayout>
      {/* Breadcrumb + share */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 max-w-6xl py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
            <button onClick={() => setLocation("/setting")} className="hover:text-primary transition-colors">
              Settings
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary truncate max-w-[200px]">{setting.title}</span>
          </div>
          <ShareButton shareUrl={shareUrl} title={setting.title} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

          {/* ── LEFT: Gallery ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Desktop: thumbs left + main image */}
            <div className="flex gap-4">
              {/* Thumbnail strip (desktop vertical) */}
              <div className="hidden lg:flex flex-col gap-2.5 shrink-0">
                {galleryItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedItemIdx(idx)}
                    className={cn(
                      "w-[72px] h-[72px] border-2 overflow-hidden shrink-0 relative transition-all",
                      selectedItemIdx === idx
                        ? "border-primary"
                        : "border-border opacity-60 hover:opacity-90 hover:border-primary/40",
                    )}
                  >
                    <img
                      src={item.url}
                      alt={item.kind === "gif" ? "Video view" : `View ${idx + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                    {item.kind === "gif" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Main image with arrows */}
              <div className="flex-1">
                <div
                  className="relative w-full bg-[#f8f7f5] border border-border overflow-hidden select-none cursor-grab active:cursor-grabbing"
                  style={{ paddingBottom: "100%" }}
                  {...swipeHandlers}
                >
                  {selectedItem ? (
                    <img
                      src={selectedItem.url}
                      alt={setting.title}
                      className="absolute inset-0 w-full h-full object-contain p-6 md:p-10 transition-opacity duration-300"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-4xl font-serif">◇</div>
                  )}

                  {/* Video badge */}
                  {selectedItem?.kind === "gif" && (
                    <div className="absolute top-3 right-3 bg-primary/85 text-primary-foreground text-[9px] uppercase tracking-widest px-2.5 py-1 flex items-center gap-1.5">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Video
                    </div>
                  )}

                  {/* Left / Right arrows */}
                  {galleryItems.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-border flex items-center justify-center hover:bg-white hover:border-primary/40 transition-all shadow-sm z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-border flex items-center justify-center hover:bg-white hover:border-primary/40 transition-all shadow-sm z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {galleryItems.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {galleryItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedItemIdx(idx)}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            selectedItemIdx === idx ? "bg-primary" : "bg-primary/30",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile horizontal thumbnail strip */}
            <div className="flex lg:hidden gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {galleryItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedItemIdx(idx)}
                  className={cn(
                    "w-16 h-16 border-2 shrink-0 overflow-hidden relative transition-all",
                    selectedItemIdx === idx ? "border-primary" : "border-border opacity-60",
                  )}
                >
                  <img src={item.url} alt={`View ${idx + 1}`} className="w-full h-full object-contain p-1" />
                  {item.kind === "gif" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Configuration panel ────────────────────────────────── */}
          <div className="space-y-8">
            {/* Title + price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide leading-tight mb-2">
                {setting.title}
              </h1>
              <p className="text-2xl font-serif text-amber-700 tracking-wider mb-5">
                ${activeVariant?.price.toLocaleString() ?? "—"} AUD
              </p>
              {setting.description && (
                <div
                  className="prose prose-sm text-muted-foreground font-sans leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: setting.description }}
                />
              )}
            </div>

            <div className="space-y-7 pt-6 border-t border-border">

              {/* Metal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="uppercase tracking-widest text-[11px] font-bold text-primary">Metal</Label>
                  <span className="text-sm font-serif italic text-muted-foreground">{selectedMetal}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableMetals.map((m) => {
                    const metalConfig = config?.metals.find((c) => c.label === m);
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMetal(m);
                          const shapes = setting.variants.filter((v) => v.metal === m).map((v) => v.shape);
                          if (!shapes.includes(selectedShape)) setSelectedShape(shapes[0]);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all",
                          selectedMetal === m
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/40 hover:scale-110",
                        )}
                        title={m}
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{ background: metalColor(metalConfig?.tone ?? m) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diamond Shape */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="uppercase tracking-widest text-[11px] font-bold text-primary">Diamond Shape</Label>
                  <span className="text-sm font-serif italic text-muted-foreground">{selectedShape}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableShapesForMetal.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedShape(s)}
                      className={cn(
                        "px-4 py-2.5 border text-xs tracking-wider uppercase transition-colors",
                        selectedShape === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-primary hover:border-primary/50",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prong Type */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className={cn(
                    "uppercase tracking-widest text-[11px] font-bold",
                    validationErrors.some(e => e.includes("prong")) ? "text-red-600" : "text-primary",
                  )}>
                    Prong Type{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {prongType && (
                    <span className="text-sm font-serif italic text-muted-foreground">{prongType}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRONG_TYPES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setProngType(p.value)}
                      className={cn(
                        "flex flex-col items-center border px-3 py-3 text-center transition-all",
                        prongType === p.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        prongType === p.value ? "text-primary" : "text-primary",
                      )}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ring Size */}
              <div className="space-y-3">
                <Label className={cn(
                  "uppercase tracking-widest text-[11px] font-bold flex items-center gap-1",
                  validationErrors.some(e => e.includes("ring size")) ? "text-red-600" : "text-primary",
                )}>
                  Ring Size <span className="text-red-500">*</span>
                </Label>
                <Select value={ringSize} onValueChange={setRingSize}>
                  <SelectTrigger className={cn(
                    "rounded-none h-12 focus:ring-0",
                    validationErrors.some(e => e.includes("ring size"))
                      ? "border-red-400 focus:border-red-400"
                      : "border-border focus:border-primary",
                  )}>
                    <SelectValue placeholder="Select your ring size" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {config?.ringSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground font-sans">
                  Not sure?{" "}
                  <a href="https://www.ring-sizer.info/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                    Use our free ring sizer guide →
                  </a>
                </p>
              </div>

              {/* Engraving */}
              {config?.engravingEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="uppercase tracking-widest text-[11px] font-bold text-primary">
                      Engraving{" "}
                      <span className="text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
                    </Label>
                    <span className={cn(
                      "text-xs font-sans tabular-nums",
                      engraving.length >= 6 ? "text-amber-600 font-semibold" : "text-muted-foreground",
                    )}>
                      {engraving.length} / 6
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. ALWAYS (max 6 characters)"
                      value={engraving}
                      onChange={(e) => setEngraving(sanitizeEngraving(e.target.value))}
                      maxLength={6}
                      className="w-full h-12 border border-border bg-white px-4 text-sm font-sans text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors uppercase tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans">
                    Letters and numbers only (A–Z, 0–9). Maximum 6 characters.
                  </p>
                </div>
              )}

              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <div className="border border-red-200 bg-red-50 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Please complete the following:</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((err) => (
                      <li key={err} className="text-xs text-red-600 font-sans">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Primary CTA */}
              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleSelectSetting}
                  disabled={!activeVariant}
                  className="w-full h-14 rounded-none font-serif text-lg tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {existingDiamond ? "Update Selection" : "Choose This Setting"}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>

                {/* Consult an expert */}
                <a
                  href="mailto:hello@southernstardiamonds.com.au?subject=Ring Setting Enquiry"
                  className="w-full h-12 rounded-none border border-border text-sm font-sans tracking-wide text-primary hover:border-primary/50 hover:bg-muted/30 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Consult an Expert
                </a>

                <p className="text-center text-[11px] text-muted-foreground font-sans">
                  Setting price only. Final ring price includes your chosen diamond.
                </p>
              </div>

              {/* Trust badges */}
              <div className="border border-border rounded-sm p-4 space-y-3">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3">
                    <TrustIcon icon={badge.icon} />
                    <div>
                      <p className="text-xs font-semibold text-primary leading-snug">{badge.title}</p>
                      <p className="text-[11px] text-muted-foreground font-sans">{badge.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy accordions */}
              <div className="border-b border-border">
                {POLICY_ACCORDIONS.map((accordion) => (
                  <AccordionItem
                    key={accordion.id}
                    title={accordion.title}
                    bullets={accordion.bullets}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
