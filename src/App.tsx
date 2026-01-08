import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LanguageProvider } from "@/i18n/LanguageProvider";

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
const BrandDealsMarketplace = lazy(() => import("./pages/BrandDealsMarketplace"));
const DeveloperPortal = lazy(() => import("./pages/DeveloperPortal"));
const InteractivePlayer = lazy(() => import("./pages/InteractivePlayer"));
const TokenStaking = lazy(() => import("./pages/TokenStaking"));
const MobileApp = lazy(() => import("./pages/MobileApp"));
const CreatorAnalytics = lazy(() => import("./pages/CreatorAnalytics"));
const VideoDubbing = lazy(() => import("./pages/VideoDubbing"));
const ThumbnailGenerator = lazy(() => import("./pages/ThumbnailGenerator"));
const Syndication = lazy(() => import("./pages/Syndication"));
const ExtensionMarketplace = lazy(() => import("./pages/ExtensionMarketplace"));
const MultiStreamHub = lazy(() => import("./pages/MultiStreamHub"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { RequireOnboarding } from "@/components/auth/RequireOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
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
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

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
                  <Route path="/brand-deals" element={<BrandDealsMarketplace />} />
                  <Route path="/developers" element={<DeveloperPortal />} />
                  <Route path="/interactive" element={<InteractivePlayer />} />
                  <Route path="/staking" element={<TokenStaking />} />
                  <Route path="/mobile" element={<MobileApp />} />
                  <Route path="/analytics" element={<CreatorAnalytics />} />
                  <Route path="/dubbing" element={<VideoDubbing />} />
                  <Route path="/thumbnails" element={<ThumbnailGenerator />} />
                  <Route path="/syndication" element={<Syndication />} />
                  <Route path="/extensions" element={<ExtensionMarketplace />} />
                  <Route path="/multistream" element={<MultiStreamHub />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Web3Provider>
  </LanguageProvider>
);

export default App;