```
import { ContentInput } from "@/components/ContentInput";
import { ContentResults } from "@/components/ContentResults";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, Trophy, Plus, FolderOpen, Clock } from "lucide-react";
import { useDashboardLogic } from "@/hooks/useDashboardLogic";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
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
  const rateLimitProgress = (generationCount / 10) * 100;
  const xpProgress = (gamification.xp / gamification.xpToNextLevel) * 100;

  return (
    <AppLayout user={user} isAdmin={isAdmin}>
      <div className="min-h-screen">
        {/* Header Section */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.contentStudio')}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {t('dashboard.subtitle')}
                </p>
              </div>
              
              {/* Stats Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span className="text-sm font-medium text-orange-300">{t('dashboard.streak', { count: gamification.streak })}</span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{t('dashboard.level', { level: gamification.level })}</span>
                  <div className="w-12 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${ xpProgress }% ` }} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">{t('dashboard.credits', { count: remainingGenerations })}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Sidebar - Quick Actions & Projects */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={handleNewProject} 
                    className="w-full justify-start gap-2"
                    variant="default"
                  >
                    <Plus className="w-4 h-4" />
                    {t('dashboard.newProject')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => window.location.href = "/video-studio"}
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('dashboard.aiVideoStudio')}
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.usageThisHour')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.generations')}</span>
                    <span className="font-medium">{generationCount}/10</span>
                  </div>
                  <Progress value={rateLimitProgress} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {t('dashboard.resetsEveryHour')}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Projects */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    {t('dashboard.recentProjects')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.yourRecentProjects')}
                  </p>
                </CardContent>
              </Card>
            </aside>

            {/* Main Workspace */}
            <div className="lg:col-span-4 space-y-8">
              {/* Input Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        {t('dashboard.createContent')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('dashboard.createContentSubtitle')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex">
                      {t('dashboard.aiPowered')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ContentInput onGenerate={handleGenerate} loading={loading} />
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('dashboard.generatedResults')}</CardTitle>
                    {generatedContent && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                        {t('dashboard.readyToUse')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ContentResults
                    content={generatedContent}
                    remainingGenerations={remainingGenerations}
                    rateLimitStatus={rateLimitProgress}
                    onRemix={handleRemix}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
