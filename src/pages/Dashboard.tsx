import { ProjectSidebar } from "@/components/ProjectSidebar";
import { ContentInput } from "@/components/ContentInput";
import { ContentResults } from "@/components/ContentResults";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Flame, Sparkles, Trophy } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { MobileNav } from "@/components/ui/MobileNav";
import { useDashboardLogic } from "@/hooks/useDashboardLogic";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const {
    user,
    isAdmin,
    loading,
    selectedProjectId,
    generatedContent,
    generationCount,
    gamification,
    handleLogout,
    handleNewProject,
    handleGenerate,
    handleRemix,
    handleSelectProject,
  } = useDashboardLogic();

  if (!user) {
    return null;
  }

  const remainingGenerations = Math.max(0, 10 - generationCount);
  const rateLimitStatus = Math.min(100, (generationCount / 10) * 100);
  const xpProgress = (gamification.xp / gamification.xpToNextLevel) * 100;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, handled by MobileNav */}
      <div className="hidden md:block w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <ProjectSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Studio
            </h1>

            {/* Gamification Widgets */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium" title="Daily Streak">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>{gamification.streak} Day Streak</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium" title={`Level ${gamification.level}`}>
                <Trophy className="w-3.5 h-3.5" />
                <span>Lvl {gamification.level}</span>
                <div className="w-16 h-1.5 bg-blue-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button onClick={() => window.location.href = "/admin"} variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            )}

            <Button variant="outline" size="sm" className="hidden sm:flex border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {remainingGenerations} Credits
            </Button>

            <ConnectWallet />

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-white hover:bg-white/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Input Section */}
            <div className="flex-1 overflow-y-auto p-6 border-r border-white/5">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Create Content</h2>
                  <p className="text-muted-foreground">Transform your ideas into viral posts for all platforms.</p>
                </div>
                <div className="glass-card p-6 rounded-xl border-white/5">
                  <ContentInput onGenerate={handleGenerate} loading={loading} />
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              <div className="max-w-2xl mx-auto h-full flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Generated Results</h2>
                  <div className="text-xs text-muted-foreground">
                    {rateLimitStatus}% Rate Limit
                  </div>
                </div>
                <div className="flex-1">
                  <ContentResults
                    content={generatedContent}
                    remainingGenerations={remainingGenerations}
                    rateLimitStatus={rateLimitStatus}
                    onRemix={handleRemix}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};

export default Dashboard;
