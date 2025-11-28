import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, LogOut, Settings as SettingsIcon, Star, Radio } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { RaidButton } from "@/components/RaidButton";

interface Project {
  id: string;
  title: string;
  created_at: string;
}

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onNewProject: () => void;
}

export const ProjectSidebar = ({ selectedProjectId, onSelectProject, onNewProject }: ProjectSidebarProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem("favorite_projects");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  };

  const toggleFavorite = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }
    setFavorites(newFavorites);
    localStorage.setItem("favorite_projects", JSON.stringify(Array.from(newFavorites)));
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredProjects = showFavoritesOnly
    ? projects.filter(p => favorites.has(p.id))
    : projects;

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col h-screen">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">FlowAI</h2>
      </div>

      <div className="p-4 space-y-2">
        <Button onClick={onNewProject} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 group"
          onClick={() => toast.info("Live Studio coming soon!")}
        >
          <div className="relative mr-2 flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <Radio className="relative w-4 h-4" />
          </div>
          <span className="font-bold">LIVE NOW</span>
          <span className="ml-auto text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-400 font-mono">12.4k</span>
        </Button>

        <Button
          variant={showFavoritesOnly ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {showFavoritesOnly ? "Show All" : "Favorites Only"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {showFavoritesOnly ? "No favorite projects" : "No projects yet"}
            </p>
          ) : (
            filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group relative ${selectedProjectId === project.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
              >
                <div className="flex items-start gap-2 pr-6">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{project.title}</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => toggleFavorite(e, project.id)}
                  className={`absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-sidebar-accent rounded ${favorites.has(project.id) ? "opacity-100 text-yellow-400" : "text-muted-foreground"
                    }`}
                >
                  <Star className={`w-3 h-3 ${favorites.has(project.id) ? "fill-yellow-400" : ""}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={() => navigate("/settings")}
          variant="ghost"
          size="sm"
          className="w-full justify-start mb-2"
        >
          <SettingsIcon className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
