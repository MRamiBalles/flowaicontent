import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load all route components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const Index = lazy(() => import("./pages/Index"));
const VideoStudio = lazy(() => import("./pages/VideoStudio"));
const CoStream = lazy(() => import("./pages/CoStream"));
const MintNFT = lazy(() => import("./pages/MintNFT"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const StreamerStudio = lazy(() => import("./pages/StreamerStudio"));
const MusicVideo = lazy(() => import("./pages/MusicVideo"));
const Feed = lazy(() => import("./pages/Feed"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FlowRoulette = lazy(() => import("./pages/FlowRoulette"));
const Watch = lazy(() => import("./pages/Watch"));
const VoiceStudio = lazy(() => import("./pages/VoiceStudio"));
const LicensingMarketplace = lazy(() => import("./pages/LicensingMarketplace"));
const VideoEditorPro = lazy(() => import("./pages/VideoEditorPro"));
const EnterpriseAdmin = lazy(() => import("./pages/EnterpriseAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { RequireOnboarding } from "@/components/auth/RequireOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <Web3Provider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OnboardingTutorial />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Protected Routes requiring Onboarding */}
              <Route element={<RequireOnboarding />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/video-studio" element={<VideoStudio />} />
                <Route path="/co-stream" element={<CoStream />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/editor" element={<VideoEditor />} />
                <Route path="/mint-nft" element={<MintNFT />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/streamer-mode" element={<StreamerStudio />} />
                <Route path="/music-video" element={<MusicVideo />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/roulette" element={<FlowRoulette />} />
                <Route path="/watch/:videoId" element={<Watch />} />
                <Route path="/voice-studio" element={<VoiceStudio />} />
                <Route path="/licensing" element={<LicensingMarketplace />} />
                <Route path="/video-editor-pro" element={<VideoEditorPro />} />
                <Route path="/enterprise" element={<EnterpriseAdmin />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Web3Provider>
);

export default App;