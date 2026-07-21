import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDiamond } from "@workspace/api-client-react";
import { useBuilderStore } from "@/store/use-builder-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DiamondDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: diamond, isLoading, isError } = useGetDiamond(id ?? '');
  
  const setDiamond = useBuilderStore((state) => state.setDiamond);
  const existingSetting = useBuilderStore((state) => state.setting);

  const handleSelectDiamond = () => {
    if (!diamond) return;
    
    setDiamond({
      id: diamond.id,
      shape: diamond.certificate.shape,
      carat: diamond.certificate.carats,
      color: diamond.certificate.color,
      clarity: diamond.certificate.clarity,
      cut: diamond.certificate.cut || undefined,
      price: diamond.price,
      image: diamond.image || undefined,
      video: diamond.video || undefined,
      certificate: diamond.certificate.certNumber || undefined,
      lab: diamond.certificate.lab || undefined
    });

    if (existingSetting) {
      setLocation("/review");
    } else {
      setLocation("/setting");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 max-w-5xl flex flex-col md:flex-row gap-12">
          <Skeleton className="w-full md:w-1/2 aspect-square" />
          <div className="w-full md:w-1/2 space-y-8">
            <Skeleton className="w-3/4 h-12" />
            <Skeleton className="w-1/3 h-8" />
            <Skeleton className="w-full h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !diamond) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-serif text-primary mb-4">Diamond Not Found</h2>
          <Button variant="outline" className="rounded-none border-primary text-primary" onClick={() => setLocation("/diamond")}>Return to Search</Button>
        </div>
      </AppLayout>
    );
  }

  const specs = [
    { label: "Shape", value: diamond.certificate.shape },
    { label: "Carat Weight", value: diamond.certificate.carats.toFixed(2) },
    { label: "Color", value: diamond.certificate.color },
    { label: "Clarity", value: diamond.certificate.clarity },
    { label: "Cut", value: diamond.certificate.cut || "-" },
    { label: "Polish", value: diamond.certificate.polish || "-" },
    { label: "Symmetry", value: diamond.certificate.symmetry || "-" },
    { label: "Fluorescence", value: "-" },
    { label: "L/W Ratio", value: diamond.certificate.length && diamond.certificate.width ? (diamond.certificate.length / diamond.certificate.width).toFixed(2) : "-" },
    { label: "Certificate", value: diamond.certificate.lab || "-" },
  ];

  return (
    <AppLayout>
      <div className="bg-[#fbfbfb] border-b border-border py-4 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link href="/diamond" className="inline-flex items-center text-sm font-sans tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Media */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-white border border-border aspect-square relative p-8 flex items-center justify-center">
              {diamond.video ? (
                <video 
                  src={diamond.video} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-contain"
                />
              ) : diamond.image ? (
                <img 
                  src={diamond.image} 
                  alt={`${diamond.certificate.carats}ct ${diamond.certificate.shape} Diamond`}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              ) : (
                <div className="text-muted-foreground font-serif text-xl italic">No visual media available</div>
              )}
            </div>
            
            {(diamond.video || diamond.image) && (
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                Actual Diamond Shown
              </p>
            )}
          </div>

          {/* Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-serif text-primary tracking-wide mb-4 capitalize">
                {diamond.certificate.carats.toFixed(2)} Carat {diamond.certificate.shape} Diamond
              </h1>
              <p className="text-3xl font-serif text-accent tracking-wider mb-2">
                ${diamond.price.toLocaleString()} AUD
              </p>
              <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-muted-foreground mt-4">
                <span className="px-2 py-1 bg-muted/30 border border-border">{diamond.certificate.lab || 'Certified'}</span>
                {diamond.certificate.certNumber && <span>Cert: {diamond.certificate.certNumber}</span>}
              </div>
            </div>

            <div className="border border-border bg-white mb-10">
              <div className="p-4 border-b border-border bg-[#fbfbfb]">
                <h3 className="uppercase tracking-widest text-xs font-bold text-primary">Diamond Specifications</h3>
              </div>
              <div className="grid grid-cols-2 p-6 gap-y-4 gap-x-8">
                {specs.map((spec, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-muted/30 pb-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{spec.label}</span>
                    <span className="font-serif text-primary text-lg capitalize">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-border">
              <Button 
                onClick={handleSelectDiamond}
                className="w-full h-16 rounded-none font-serif text-xl tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:-translate-y-1 transition-all"
              >
                {existingSetting ? "Complete Your Ring" : "Add to Ring & Choose Setting"} <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
