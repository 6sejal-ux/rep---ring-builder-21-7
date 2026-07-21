import { TopNav } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#fbfbfb]">
      <TopNav />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-12 border-t border-border bg-white mt-auto">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <p className="font-serif text-2xl mb-4 text-primary tracking-wide">Southern Star Diamonds</p>
          <p className="text-muted-foreground text-sm tracking-widest uppercase font-sans">Crafted with precision. Designed for forever.</p>
        </div>
      </footer>
    </div>
  );
}
