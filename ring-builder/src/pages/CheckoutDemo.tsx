import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useBuilderStore } from "@/store/use-builder-store";
import { useEffect } from "react";

export default function CheckoutDemo() {
  const { setting, diamond, resetBuilder } = useBuilderStore();

  useEffect(() => {
    // We don't want to reset immediately in case they refresh, 
    // but in a real app we'd clear state after successful purchase
    // return () => resetBuilder();
  }, []);

  return (
    <AppLayout>
      <div className="flex-1 bg-[#fbfbfb] py-24 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white border border-border p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-serif text-primary mb-4 tracking-wide">Ready for Checkout</h1>
          <p className="text-muted-foreground font-sans mb-8">
            This is a demonstration environment. In production, you would have been redirected to the Shopify checkout with your custom ring added to the cart.
          </p>
          
          <div className="bg-muted/20 border border-border p-6 mb-8 text-left">
            <h3 className="uppercase tracking-widest text-xs font-bold text-primary mb-4">Cart Contents Prepared</h3>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setting:</span>
                <span className="font-serif text-primary truncate max-w-[200px]" title={setting?.title}>{setting?.title || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diamond:</span>
                <span className="font-serif text-primary">{diamond?.carat?.toFixed(2)}ct {diamond?.shape}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Total:</span>
                <span className="font-serif text-primary font-bold">${((setting?.price || 0) + (diamond?.price || 0)).toLocaleString()} AUD</span>
              </div>
            </div>
          </div>

          <Button 
            asChild
            className="w-full rounded-none font-serif text-lg tracking-wide h-14 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/" onClick={() => resetBuilder()}>Start a New Ring</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
