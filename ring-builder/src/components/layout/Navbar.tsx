import { Link, useLocation } from "wouter";
import { useBuilderStore } from "@/store/use-builder-store";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNav() {
  const [location] = useLocation();
  const { setting, diamond } = useBuilderStore();

  const isSettingsCompleted = !!setting;
  const isDiamondCompleted = !!diamond;

  const steps = [
    {
      id: 1,
      name: "Choose Your Setting",
      path: "/setting",
      completed: isSettingsCompleted,
      active: location.startsWith("/setting") || location === "/",
    },
    {
      id: 2,
      name: "Choose Your Diamond",
      path: "/diamond",
      completed: isDiamondCompleted,
      active: location.startsWith("/diamond"),
    },
    {
      id: 3,
      name: "Review & Checkout",
      path: "/review",
      completed: false,
      active: location.startsWith("/review"),
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm font-serif">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="text-2xl tracking-wide font-medium text-primary cursor-pointer hover:text-accent transition-colors shrink-0">
            SOUTHERN STAR
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-8">
                <Link 
                  href={step.path}
                  className={cn(
                    "flex items-center gap-3 group cursor-pointer transition-colors",
                    step.active ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center border transition-all duration-300",
                    step.completed ? "bg-primary border-primary text-primary-foreground" :
                    step.active ? "border-primary text-primary" : "border-muted text-muted-foreground",
                    step.active && !step.completed && "bg-muted/30"
                  )}>
                    {step.completed ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={cn(
                    "text-lg tracking-wide",
                    step.active ? "font-medium" : ""
                  )}>
                    {step.name}
                  </span>
                </Link>
                {index < steps.length - 1 && (
                  <div className="w-12 h-[1px] bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile steps */}
      <div className="md:hidden flex border-t border-border overflow-x-auto hide-scrollbar bg-muted/20">
        {steps.map((step) => (
          <Link 
            key={step.id}
            href={step.path}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 px-4 min-w-[120px] cursor-pointer transition-colors border-b-2",
              step.active ? "border-primary text-primary bg-white" : "border-transparent text-muted-foreground hover:bg-muted/40"
            )}
          >
            <span className="text-xs font-sans tracking-widest uppercase mb-1">STEP {step.id}</span>
            <span className="text-sm tracking-wide text-center whitespace-nowrap">{step.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
