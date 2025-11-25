import { useState, useEffect } from "react";
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

const STEPS = [
  {
    title: "Welcome to FlowAI!",
    description: "Your professional AI video creation studio awaits. Let's get you started with a quick tour of what you can do.",
    icon: <Rocket className="w-12 h-12 text-primary mb-4" />,
  },
  {
    title: "Create Your First Project",
    description: "Head to the Video Studio to start a new project. You can generate scripts, storyboards, and full videos from a simple prompt.",
    icon: <Video className="w-12 h-12 text-blue-500 mb-4" />,
  },
  {
    title: "Unleash AI Tools",
    description: "Use our advanced AI tools to clone voices, generate music, and apply style transfers to your content.",
    icon: <Wand2 className="w-12 h-12 text-purple-500 mb-4" />,
  },
  {
    title: "Monetize in the Marketplace",
    description: "Sell your best clips, prompts, and style packs in the Marketplace. Earn FLO tokens for your creativity.",
    icon: <ShoppingBag className="w-12 h-12 text-green-500 mb-4" />,
  },
  {
    title: "Join the Community",
    description: "Connect with other creators, participate in bounties, and vote on platform governance. You are now part of the FlowAI family!",
    icon: <Users className="w-12 h-12 text-orange-500 mb-4" />,
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("flowai_onboarding_completed");
    if (!hasSeenTutorial) {
      setOpen(true);
    }
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            {step.icon}
            <DialogTitle className="text-2xl mb-2">{step.title}</DialogTitle>
            <DialogDescription className="text-base">
              {step.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <div className="flex gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleComplete}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <Button onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
