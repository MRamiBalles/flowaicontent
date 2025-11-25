import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

import Marketplace from "./pages/Marketplace";
import VideoEditor from "./pages/VideoEditor";
import Index from "./pages/Index";
import VideoStudio from "./pages/VideoStudio";
import CoStream from "./pages/CoStream";
import MintNFT from "./pages/MintNFT";

import { Web3Provider } from "@/components/web3/Web3Provider";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

const queryClient = new QueryClient();

const App = () => (
  <Web3Provider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OnboardingTutorial />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/video-studio" element={<VideoStudio />} />
            <Route path="/co-stream" element={<CoStream />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/editor" element={<VideoEditor />} />
            <Route path="/mint-nft" element={<MintNFT />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Web3Provider>
);

export default App;
