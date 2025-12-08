import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Heart, Zap, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";

const AMOUNTS = [
    { value: 100, label: "$1", icon: Heart, color: "text-red-500 bg-red-500/10" },
    { value: 500, label: "$5", icon: Zap, color: "text-yellow-500 bg-yellow-500/10" },
    { value: 1000, label: "$10", icon: Rocket, color: "text-purple-500 bg-purple-500/10" },
    { value: 5000, label: "$50", icon: Award, color: "text-blue-500 bg-blue-500/10" },
];

export function DonationModal({ streamerId, streamerName }: { streamerId: string, streamerName: string }) {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDonate = async () => {
        if (!selectedAmount) return;
        if (!user) {
            toast.error("Please login to donate");
            return;
        }

        setLoading(true);

        try {
            // 1. Record in DB
            const { error } = await (supabase as any).from("donations").insert({
                donor_id: user.id,
                streamer_id: streamerId,
                amount_cents: selectedAmount,
                message: "Great stream! 🚀"
            });

            if (error) throw error;

            // 2. Trigger Celebration
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast.success(`Sent ${selectedAmount / 100} Boost to ${streamerName}!`);
            setIsOpen(false);

        } catch (err: any) {
            toast.error(err.message || "Donation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20 rounded-full">
                    <Rocket className="mr-2 h-4 w-4" />
                    Boost Stream
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Support {streamerName}</DialogTitle>
                    <DialogDescription>
                        Send a "Boost" to support this creator's constructive content.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {AMOUNTS.map((amt) => (
                        <div
                            key={amt.value}
                            onClick={() => setSelectedAmount(amt.value)}
                            className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:border-primary ${selectedAmount === amt.value ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'border-border'}`}
                        >
                            <div className={`p-2 rounded-full ${amt.color}`}>
                                <amt.icon className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-lg">{amt.label}</span>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <p className="text-xs text-muted-foreground mr-auto mt-2">
                        Powered by FlowAI Payments
                    </p>
                    <Button onClick={handleDonate} disabled={!selectedAmount || loading} className="w-full">
                        {loading ? "Processing..." : "Send Boost 🚀"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
