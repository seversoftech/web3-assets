import { AssetDashboard } from "@/components/AssetDashboard";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Blocks } from "lucide-react";


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="fixed top-0 w-full z-10 bg-background/80 backdrop-blur-lg border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Blocks className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">
              Web3Assets
            </span>
          </div>
          <div className="flex items-center gap-4">

            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <AssetDashboard />
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm">
        <p>Built with Next.js, Wagmi & Alchemy</p>
      </footer>
    </div>
  );
}
