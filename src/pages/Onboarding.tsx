import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Video, Wand2, ShoppingBag, Users, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        title: "Welcome to FlowAI!",
        description: "Your professional AI video creation studio awaits. Let's get you set up for success.",
        icon: <Rocket className="w-12 h-12 text-primary" />,
        features: ["Professional Video Tools", "AI Voice Cloning", "Global Marketplace"]
    },
    {
        title: "Create Your First Project",
        description: "Head to the Video Studio to start a new project. Generate scripts, storyboards, and more.",
        icon: <Video className="w-12 h-12 text-blue-500" />,
        features: ["Script Generation", "Storyboard AI", "One-Click Render"]
    },
    {
        title: "Unleash AI Tools",
        description: "Clone voices, generate music, and apply style transfers to your content.",
        icon: <Wand2 className="w-12 h-12 text-purple-500" />,
        features: ["Voice Cloning", "Music Generation", "Style Transfer"]
    },
    {
        title: "Monetize",
        description: "Sell your best clips and style packs. Earn tokens for your creativity.",
        icon: <ShoppingBag className="w-12 h-12 text-green-500" />,
        features: ["Sell Assets", "Earn Tokens", "Creator Economy"]
    },
    {
        title: "Join the Community",
        description: "Connect with creators, participate in bounties, and vote on governance.",
        icon: <Users className="w-12 h-12 text-orange-500" />,
        features: ["Bounties", "Governance", "Networking"]
    },
];

export default function Onboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem("flowai_onboarding_completed", "true");
        navigate("/dashboard");
    };

    const step = STEPS[currentStep];

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

            <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
                {/* Left Side - Visual */}
                <div className="p-8 md:p-12 flex flex-col justify-center items-center text-center bg-muted/30 border-r border-border/50">
                    <div className="mb-8 p-6 rounded-2xl bg-background shadow-lg ring-1 ring-border/50 transition-all duration-500 transform hover:scale-105">
                        {step.icon}
                    </div>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight">{step.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>

                    <div className="mt-8 flex gap-2">
                        {STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300",
                                    index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side - Features & Actions */}
                <div className="p-8 md:p-12 flex flex-col justify-between bg-card/50">
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground/80">
                            What you can do:
                        </h3>
                        <ul className="space-y-4">
                            {step.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-muted-foreground bg-muted/20 p-3 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-green-500" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4 mt-8">
                        <Button
                            onClick={handleNext}
                            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-primary/25"
                        >
                            {currentStep === STEPS.length - 1 ? (
                                "Get Started"
                            ) : (
                                <>
                                    Next Step <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleComplete}
                            className="w-full text-muted-foreground hover:text-foreground"
                        >
                            Skip Introduction
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
