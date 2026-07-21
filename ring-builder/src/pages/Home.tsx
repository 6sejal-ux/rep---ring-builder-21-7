import { useLocation } from "wouter";
import { useBuilderStore } from "@/store/use-builder-store";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const setStartWith = useBuilderStore((state) => state.setStartWith);

  const handleStartSetting = () => {
    setStartWith("setting");
    setLocation("/setting");
  };

  const handleStartDiamond = () => {
    setStartWith("diamond");
    setLocation("/diamond");
  };

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary tracking-wide">
              Design Your Perfect Ring
            </h1>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto text-lg">
              Begin your journey by selecting a masterfully crafted setting, or find the perfect diamond first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-16">
            {/* Start with Setting Card */}
            <div 
              onClick={handleStartSetting}
              className="group relative bg-white border border-border p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
            >
              <div className="w-32 h-32 mb-8 relative rounded-full bg-muted/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary">
                   <circle cx="12" cy="12" r="8" />
                   <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                 </svg>
              </div>
              <h2 className="text-2xl font-serif mb-4 text-primary tracking-wide">Start with a Setting</h2>
              <p className="text-muted-foreground text-center mb-8 font-sans">
                Browse our collection of expertly crafted ring settings in platinum and gold.
              </p>
              <Button 
                variant="outline" 
                className="w-full font-serif text-lg tracking-wide rounded-none border-primary/20 hover:bg-primary hover:text-white transition-colors h-14"
              >
                Browse Settings
              </Button>
            </div>

            {/* Start with Diamond Card */}
            <div 
              onClick={handleStartDiamond}
              className="group relative bg-white border border-border p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
            >
              <div className="w-32 h-32 mb-8 relative rounded-full bg-muted/30 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary">
                   <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
                   <path d="M2 9h20" />
                   <path d="M12 21L6 9" />
                   <path d="M12 21l6-12" />
                 </svg>
              </div>
              <h2 className="text-2xl font-serif mb-4 text-primary tracking-wide">Start with a Diamond</h2>
              <p className="text-muted-foreground text-center mb-8 font-sans">
                Search thousands of certified natural and lab-grown diamonds.
              </p>
              <Button 
                variant="outline" 
                className="w-full font-serif text-lg tracking-wide rounded-none border-primary/20 hover:bg-primary hover:text-white transition-colors h-14"
              >
                Search Diamonds
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
