import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";
import { useSoundEffects } from "@/hooks/use-sound-effects";

export interface StyleOption {
    id: string;
    name: string;
    description: string;
    previewColor: string; // Tailwind gradient class for preview
}

/**
 * Available visual styles for AI content generation.
 * 
 * Each style has:
 * - Unique ID for backend processing
 * - Display name and description for UI
 * - Preview gradient color (Tailwind classes)
 * 
 * In production, would include:
 * - Actual preview images
 * - LoRA model identifiers
 * - Style pack pricing
 */
const STYLES: StyleOption[] = [
    {
        id: "cinematic",
        name: "Cinematic Realism",
        description: "High fidelity, movie-like aesthetics with dramatic lighting.",
        previewColor: "from-slate-900 to-slate-700",
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk Neon",
        description: "Futuristic, high contrast, neon lights and rain.",
        previewColor: "from-purple-900 to-pink-600",
    },
    {
        id: "anime",
        name: "Anime Studio",
        description: "Vibrant 2D animation style with clean lines.",
        previewColor: "from-blue-400 to-indigo-500",
    },
    {
        id: "watercolor",
        name: "Watercolor Art",
        description: "Soft, artistic, hand-painted look.",
        previewColor: "from-emerald-200 to-teal-400",
    },
];

interface StyleSelectorProps {
    selectedStyle: string;     // Currently selected style ID
    onSelect: (styleId: string) => void;  // Callback when style is selected
}

/**
 * StyleSelector Component
 * 
 * UI for selecting visual style for AI content generation.
 * 
 * Features:
 * - Grid of 4 predefined styles
 * - Gradient preview backgrounds
 * - Selected state with checkmark
 * - Sound effects on click
 * - Hover animations
 * 
 * Styles Available:
 * - Cinematic Realism: Movie-like, dramatic lighting
 * - Cyberpunk Neon: Futuristic, high contrast
 * - Anime Studio: Vibrant 2D animation
 * - Watercolor Art: Soft, hand-painted
 * 
 * Integration:
 * - Selected style ID passed to generate-content Edge Function
 * - Backend maps ID to LoRA model or style parameters
 */
export const StyleSelector = ({ selectedStyle, onSelect }: StyleSelectorProps) => {
    const { playSound } = useSoundEffects();

    const handleSelect = (id: string) => {
        playSound('click');
        onSelect(id);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-300">
                <Palette className="w-4 h-4" />
                <span className="text-sm font-medium">Visual Style</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => handleSelect(style.id)}
                        className={cn(
                            "relative group p-3 rounded-xl border text-left transition-all duration-300",
                            "hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                            selectedStyle === style.id
                                ? "bg-white/10 border-purple-500/50 ring-1 ring-purple-500/50"
                                : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5"
                        )}
                    >
                        <div className={cn(
                            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-20 transition-opacity",
                            style.previewColor,
                            selectedStyle === style.id ? "opacity-30" : "group-hover:opacity-30"
                        )} />

                        <div className="relative z-10 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "font-medium text-sm",
                                    selectedStyle === style.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                )}>
                                    {style.name}
                                </span>
                                {selectedStyle === style.id && (
                                    <div className="bg-purple-500 rounded-full p-0.5">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2">
                                {style.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
