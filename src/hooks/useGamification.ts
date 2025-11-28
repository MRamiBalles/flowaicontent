import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface GamificationState {
    streak: number;
    lastActionDate: string | null;
    level: number;
    xp: number;
    xpToNextLevel: number;
}

// Simple sound effect player
const playSound = (type: 'success' | 'levelup' | 'streak') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'success':
            // Coin / Powerup sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case 'levelup':
            // Victory fanfare
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now); // C5
            osc.frequency.setValueAtTime(659, now + 0.15); // E5
            osc.frequency.setValueAtTime(784, now + 0.3); // G5
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
            break;

        case 'streak':
            // Fire whoosh
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
    }
};

export const useGamification = () => {
    const [state, setState] = useState<GamificationState>(() => {
        const saved = localStorage.getItem('flowai_gamification');
        return saved ? JSON.parse(saved) : {
            streak: 0,
            lastActionDate: null,
            level: 1,
            xp: 0,
            xpToNextLevel: 100
        };
    });

    useEffect(() => {
        localStorage.setItem('flowai_gamification', JSON.stringify(state));
    }, [state]);

    const performAction = (actionType: 'generate' | 'remix' | 'share') => {
        const today = new Date().toDateString();
        const lastDate = state.lastActionDate ? new Date(state.lastActionDate).toDateString() : null;

        let newStreak = state.streak;
        let xpGain = 0;

        // Streak Logic
        if (lastDate !== today) {
            if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
                // Consecutive day
                newStreak += 1;
                playSound('streak');
                toast.success(`🔥 Streak increased! ${newStreak} days on fire!`);
            } else if (lastDate && lastDate !== today) {
                // Broken streak (unless it's the first action ever)
                if (state.lastActionDate) {
                    newStreak = 1;
                    toast.info("Streak reset. Let's build it back up!");
                } else {
                    newStreak = 1;
                }
            } else {
                // First action ever or same day (logic handled above, this is fallback)
                if (!state.lastActionDate) newStreak = 1;
            }
        }

        // XP Logic
        switch (actionType) {
            case 'generate': xpGain = 10; break;
            case 'remix': xpGain = 15; break;
            case 'share': xpGain = 20; break;
        }

        playSound('success');
        let newXp = state.xp + xpGain;
        let newLevel = state.level;
        let newXpToNext = state.xpToNextLevel;

        if (newXp >= state.xpToNextLevel) {
            newLevel += 1;
            newXp -= state.xpToNextLevel;
            newXpToNext = Math.floor(newXpToNext * 1.5);
            playSound('levelup');
            toast.success(`🎉 Level Up! You are now Level ${newLevel}!`);
        }

        setState({
            streak: newStreak,
            lastActionDate: new Date().toISOString(),
            level: newLevel,
            xp: newXp,
            xpToNextLevel: newXpToNext
        });
    };

    return {
        ...state,
        performAction
    };
};
