import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VideoStudio = lazy(() => import("./pages/VideoStudio"));
const CoStream = lazy(() => import("./pages/CoStream"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const MintNFT = lazy(() => import("./pages/MintNFT"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <Web3Provider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OnboardingTutorial />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Web3Provider>
);

export default App;
