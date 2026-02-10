import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Video, Wand2, ShoppingBag, Users } from "lucide-react";

// 5-step onboarding journey for new users
const STEPS = [
  {
    title: "Welcome to FlowAI!",
    description: "Your professional AI video creation studio awaits. Let's get you started with a quick tour of what you can do.",
    icon: <Rocket className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />,
  },
  {
    title: "Create Your First Project",
    description: "Head to the Video Studio to start a new project. You can generate scripts, storyboards, and full videos from a simple prompt.",
    icon: <Video className="w-12 h-12 md:w-16 md:h-16 text-blue-500 mb-3" />,
  },
  {
    title: "Unleash AI Tools",
    description: "Use our advanced AI tools to clone voices, generate music, and apply style transfers to your content.",
    icon: <Wand2 className="w-12 h-12 md:w-16 md:h-16 text-purple-500 mb-3" />,
  },
  {
    title: "Monetize in the Marketplace",
    description: "Sell your best clips, prompts, and style packs in the Marketplace. Earn FLO tokens for your creativity.",
    icon: <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-green-500 mb-3" />,
  },
  {
    title: "Join the Community",
    description: "Connect with other creators, participate in bounties, and vote on platform governance. You are now part of the FlowAI family!",
    icon: <Users className="w-12 h-12 md:w-16 md:h-16 text-orange-500 mb-3" />,
  },
];

/**
 * OnboardingTutorial Component
 * 
 * Multi-step modal tutorial for first-time users.
 * 
 * Features:
 * - 5 steps introducing core platform features
 * - localStorage tracking (flowai_onboarding_completed)
 * - Progress dots showing current step
 * - Skip or complete options
 * - Responsive design (mobile-first)
 * 
 * Flow:
 * 1. Check localStorage on mount
 * 2. If not completed, show modal
 * 3. User navigates with Next button
 * 4. Complete saves to localStorage
 * 
 * Steps:
 * 1. Welcome
 * 2. Video Studio intro
 * 3. AI tools overview
 * 4. Marketplace monetization
 * 5. Community features
 */
export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only show tutorial for authenticated users who haven't completed it
    const checkAndShow = async () => {
      const hasSeenTutorial = localStorage.getItem("flowai_onboarding_completed");
      if (hasSeenTutorial) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setOpen(true);
      }
    };

    checkAndShow();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("flowai_onboarding_completed", "true");
    setOpen(false);
  };

  const step = STEPS[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] mx-auto">
        <DialogHeader>
          <div className="flex flex-col items-center text-center px-2">
            {step.icon}
            <DialogTitle className="text-xl md:text-2xl mb-2">{step.title}</DialogTitle>
            <DialogDescription className="text-sm md:text-base leading-relaxed">
              {step.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex justify-center py-3 md:py-4">
          <div className="flex gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${index === currentStep ? "bg-primary" : "bg-muted"
                  }`}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleComplete}
            className="w-full sm:w-auto min-h-[44px] text-muted-foreground"
          >
            Skip
          </Button>
          <Button onClick={handleNext} className="w-full sm:w-auto min-h-[44px]">
            {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
