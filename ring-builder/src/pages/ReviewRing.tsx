import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useBuilderStore } from "@/store/use-builder-store";
import { useCreateCart, useValidateDiamond } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowRight, ChevronLeft } from "lucide-react";

export default function ReviewRing() {
  const [, setLocation] = useLocation();
  const { setting, diamond } = useBuilderStore();
  const { mutateAsync: validateDiamond } = useValidateDiamond();
  const { mutateAsync: createCart } = useCreateCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!setting || !diamond) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
          <h2 className="text-4xl font-serif text-primary mb-6 tracking-wide">Your Ring is Incomplete</h2>
          <p className="text-muted-foreground font-sans text-lg mb-10">
            Please select both a setting and a diamond to complete your custom ring.
          </p>
          <div className="flex justify-center gap-6">
            {!setting && (
              <Button onClick={() => setLocation("/setting")} className="rounded-none font-serif text-lg h-12 px-8">
                Choose Setting
              </Button>
            )}
            {!diamond && (
              <Button onClick={() => setLocation("/diamond")} className="rounded-none font-serif text-lg h-12 px-8">
                Choose Diamond
              </Button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalPrice = setting.price + diamond.price;

  const handleCheckout = async () => {
    if (isCheckingOut) return; // prevent double-click
    try {
      setIsCheckingOut(true);

      // 1. Validate diamond availability (revalidates against Nivoda when live)
      const validation = await validateDiamond({ data: { nivodaId: diamond.id } });

      if (!validation.available) {
        toast.error("Diamond no longer available", {
          description: "This diamond has just been sold. Please select another.",
        });
        setIsCheckingOut(false);
        return;
      }

      if (validation.priceChanged) {
        toast.info("Price updated", {
          description: "The diamond price has changed slightly from the supplier.",
        });
      }

      // 2. Create cart — backend validates and creates Shopify cart/draft order
      const cartInput = {
        settingHandle:   setting.handle,
        settingTitle:    setting.title,
        settingSku:      setting.sku,
        metal:           setting.metal,
        shape:           setting.shape,
        ringSize:        setting.ringSize   || "Not selected",
        engraving:       setting.engraving  || null,
        settingPrice:    setting.price,
        nivodaId:        diamond.id,
        diamondCarat:    diamond.carat,
        diamondColor:    diamond.color,
        diamondClarity:  diamond.clarity,
        diamondCut:      diamond.cut        || null,
        diamondCert:     diamond.certificate || null,
        diamondLab:      diamond.lab         || null,
        diamondPrice:    validation.diamond?.price ?? diamond.price,
      };

      const response = await createCart({ data: { lineItem: cartInput } });

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        setLocation("/checkout-demo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Checkout failed", {
        description: "There was an error preparing your order. Please try again.",
      });
      setIsCheckingOut(false);
    }
  };

  // ── Spec row helper ───────────────────────────────────────────────────────
  const Spec = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex gap-2">
        <span className="text-primary/50 min-w-[80px] text-right shrink-0">{label}</span>
        <span className="text-primary font-medium">{value}</span>
      </div>
    );
  };

  const dimensionLabel =
    diamond.length && diamond.width
      ? `${diamond.length.toFixed(2)} × ${diamond.width.toFixed(2)}${diamond.depth ? ` × ${diamond.depth.toFixed(2)}` : ''} mm`
      : null;

  return (
    <AppLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-14 text-center">
        <div className="container mx-auto px-4">
          <p className="text-primary-foreground/60 font-sans uppercase tracking-widest text-xs mb-3">Step 3 of 3</p>
          <h1 className="text-4xl md:text-5xl font-serif tracking-wide mb-3">View Your Masterpiece</h1>
          <p className="text-primary-foreground/70 font-sans uppercase tracking-widest text-sm">
            Your bespoke ring — crafted to your exact specifications
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Left — Configuration Details */}
          <div className="w-full lg:w-3/5 space-y-6">

            {/* ── Setting Card ── */}
            <div className="bg-white border border-border">
              <div className="px-6 pt-6 pb-3 border-b border-border flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">The Setting</p>
                  <h3 className="font-serif text-2xl text-primary mt-0.5">{setting.title}</h3>
                </div>
                <span className="font-serif text-2xl text-primary">${setting.price.toLocaleString()}</span>
              </div>

              <div className="p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-28 sm:h-28 bg-[#f9f8f6] border border-border shrink-0 p-2">
                  {setting.image ? (
                    <img src={setting.image} className="w-full h-full object-contain mix-blend-multiply" alt={setting.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-xs font-serif">No Image</div>
                  )}
                </div>

                <div className="flex-1 text-xs font-sans space-y-1.5">
                  <Spec label="SKU" value={setting.sku} />
                  <Spec label="Metal" value={setting.metal} />
                  <Spec label="Shape" value={setting.shape} />
                  {setting.ringSize && <Spec label="Ring Size" value={setting.ringSize} />}
                  {setting.engraving && (
                    <div className="flex gap-2">
                      <span className="text-primary/50 min-w-[80px] text-right shrink-0">Engraving</span>
                      <span className="text-primary font-medium italic">"{setting.engraving}"</span>
                    </div>
                  )}
                  <Spec label="Setting price" value={`AUD $${setting.price.toLocaleString()}`} />
                </div>
              </div>

              <div className="px-6 pb-4">
                <Link
                  href={`/setting/${setting.handle}`}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Change Setting
                </Link>
              </div>
            </div>

            {/* ── Diamond Card ── */}
            <div className="bg-white border border-border">
              <div className="px-6 pt-6 pb-3 border-b border-border flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">The Diamond</p>
                  <h3 className="font-serif text-2xl text-primary mt-0.5 capitalize">
                    {diamond.carat.toFixed(2)}ct {diamond.shape.toLowerCase()} Diamond
                  </h3>
                </div>
                <span className="font-serif text-2xl text-primary">${diamond.price.toLocaleString()}</span>
              </div>

              <div className="p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-28 sm:h-28 bg-[#f9f8f6] border border-border shrink-0 p-3">
                  {diamond.image ? (
                    <img src={diamond.image} className="w-full h-full object-contain" alt={diamond.shape} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-xs font-serif">No Image</div>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-sans items-start">
                  <Spec label="Source ID" value={diamond.id} />
                  <Spec label="Lab" value={diamond.lab} />
                  <Spec label="Certificate" value={diamond.certificate} />
                  <Spec label="Carat" value={`${diamond.carat.toFixed(2)} ct`} />
                  <Spec label="Shape" value={diamond.shape} />
                  <Spec label="Colour" value={diamond.color} />
                  <Spec label="Clarity" value={diamond.clarity} />
                  <Spec label="Cut" value={diamond.cut} />
                  <Spec label="Polish" value={diamond.polish} />
                  <Spec label="Symmetry" value={diamond.symmetry} />
                  <Spec label="Fluorescence" value={diamond.fluorescence} />
                  {dimensionLabel && <Spec label="Dimensions" value={dimensionLabel} />}
                  <Spec label="Diamond price" value={`AUD $${diamond.price.toLocaleString()}`} />
                </div>
              </div>

              <div className="px-6 pb-4">
                <Link
                  href="/diamond"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Change Diamond
                </Link>
              </div>
            </div>

          </div>

          {/* Right — Order Summary + CTA */}
          <div className="w-full lg:w-2/5">
            <div className="bg-primary text-primary-foreground p-8 lg:sticky lg:top-28">
              <h2 className="font-serif text-2xl mb-6 tracking-wide border-b border-primary-foreground/20 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 font-sans text-sm">
                <div className="flex justify-between text-primary-foreground/80">
                  <span>Setting — {setting.metal}</span>
                  <span>${setting.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-primary-foreground/80">
                  <span className="capitalize">{diamond.carat.toFixed(2)}ct {diamond.shape.toLowerCase()} Diamond</span>
                  <span>${diamond.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-primary-foreground/50 text-xs mt-1">
                  <span>Setting fee</span>
                  <span>Complimentary</span>
                </div>
                <div className="flex justify-between text-primary-foreground/50 text-xs">
                  <span>Insured shipping</span>
                  <span>Complimentary</span>
                </div>
              </div>

              <div className="border-t border-primary-foreground/20 pt-5 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-sans uppercase tracking-widest text-xs text-primary-foreground/70">Total (AUD inc. GST)</span>
                  <span className="font-serif text-4xl">${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* ADD TO CART */}
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-16 rounded-none bg-accent hover:bg-white text-primary font-serif text-xl tracking-wide transition-all group"
              >
                {isCheckingOut ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding to Cart…</>
                ) : (
                  <>Add to Cart <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>

              <div className="mt-6 text-center space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50 flex items-center justify-center gap-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Lifetime Warranty · GIA / IGI Certified
                </p>
                <p className="text-[10px] uppercase tracking-widest text-primary-foreground/50 flex items-center justify-center gap-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Fully Insured Delivery
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
