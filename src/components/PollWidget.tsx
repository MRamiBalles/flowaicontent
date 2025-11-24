import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PollOption {
    id: string;
    label: string;
    votes: number;
    emoji: string;
}

interface PollWidgetProps {
    question: string;
    options: PollOption[];
    duration?: number; // seconds
    onPollEnd?: (winnerId: string) => void;
}

export const PollWidget = ({ question, options: initialOptions, duration = 30, onPollEnd }: PollWidgetProps) => {
    const [options, setOptions] = useState<PollOption[]>(initialOptions);
    const [hasVoted, setHasVoted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsActive(false);
                    handlePollEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    const handleVote = (optionId: string) => {
        if (hasVoted || !isActive) return;

        setOptions(prev => prev.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ));
        setHasVoted(true);

        toast.success("Vote recorded!", {
            description: "The AI will adapt based on poll results",
            duration: 2000,
        });
    };

    const handlePollEnd = () => {
        const winner = options.reduce((max, opt) => opt.votes > max.votes ? opt : max, options[0]);

        toast.success(`🎉 Poll Complete!`, {
            description: `"${winner.label}" won! AI adapting generation...`,
            duration: 3000,
        });

        if (onPollEnd) {
            onPollEnd(winner.id);
        }
    };

    const getPercentage = (votes: number) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    return (
        <Card className="glass-panel p-4 rounded-xl border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">Live Poll</h3>
                </div>

                <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {isActive ? (
                        <>
                            <Clock className="w-3 h-3" />
                            {timeLeft}s
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3 h-3" />
                            CLOSED
                        </>
                    )}
                </div>
            </div>

            <p className="text-white text-sm mb-4 font-medium">{question}</p>

            <div className="space-y-3">
                {options.map((option) => {
                    const percentage = getPercentage(option.votes);
                    const isWinning = isActive && option.votes > 0 && option.votes === Math.max(...options.map(o => o.votes));

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted || !isActive}
                            className={`w-full p-3 rounded-lg border transition-all duration-300 relative overflow-hidden ${hasVoted || !isActive
                                    ? 'cursor-default bg-black/40'
                                    : 'cursor-pointer bg-black/20 hover:bg-black/40 hover:scale-[1.02]'
                                } ${isWinning
                                    ? 'border-blue-500/50 ring-1 ring-blue-500/20'
                                    : 'border-white/10'
                                }`}
                        >
                            {/* Progress bar background */}
                            <div
                                className={`absolute inset-0 transition-all duration-500 ${isWinning ? 'bg-blue-500/10' : 'bg-white/5'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            />

                            {/* Content */}
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{option.emoji}</span>
                                    <span className="text-white font-medium text-sm">{option.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400 font-mono">{option.votes}</span>
                                    <span className={`text-xs font-bold ${isWinning ? 'text-blue-400' : 'text-zinc-500'}`}>
                                        {percentage}%
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 text-center">
                <p className="text-[10px] text-zinc-600">
                    {hasVoted ? '✓ Your vote is recorded' : isActive ? 'Click to vote' : `Total votes: ${totalVotes}`}
                </p>
            </div>
        </Card>
    );
};
