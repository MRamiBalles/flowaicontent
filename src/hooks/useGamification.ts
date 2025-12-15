import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Gamification state persisted in localStorage
// Tracks user progress across sessions
interface GamificationState {
    streak: number;              // Consecutive days of activity
    lastActionDate: string | null; // ISO timestamp of last action
    level: number;              // Current level (starts at 1)
    xp: number;                 // Current XP in this level
    xpToNextLevel: number;      // XP needed to reach next level
}

/**
 * Generate procedural sound effects using Web Audio API
 * 
 * Creates simple retro-style sound effects without audio files:
 * - success: Coin pickup sound (triangle wave)
 * - levelup: Victory fanfare (3-note progression)
 * - streak: Fire whoosh (frequency sweep)
 * 
 * Uses oscillators and gain envelopes for basic synthesis
 * Fallback: Silently fails on browsers without Web Audio support
 * 
 * @param type - Sound effect type to play
 */
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
            // Coin / Powerup sound: Quick pitch rise
            // Triangle wave for softer tone
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);      // A4
            osc.frequency.setValueAtTime(880, now + 0.1); // A5 (octave jump)
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case 'levelup':
            // Victory fanfare: Three ascending notes (C-E-G major triad)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);      // C5
            osc.frequency.setValueAtTime(659, now + 0.15); // E5
            osc.frequency.setValueAtTime(784, now + 0.3);  // G5
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
            break;

        case 'streak':
            // Fire whoosh: Frequency sweep upward
            // Sawtooth wave for harsher, energetic tone
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

/**
 * useGamification - XP and streak tracking system
 * 
 * Implements gamification mechanics to encourage daily usage:
 * - XP system with level progression
 * - Daily streak counter
 * - Sound feedback for achievements
 * 
 * XP Rewards:
 * - generate: 10 XP (creating content)
 * - remix: 15 XP (iterating on content)
 * - share: 20 XP (publishing/sharing)
 * 
 * Level Formula:
 * - XP needed for next level = previous_requirement * 1.5
 * - Level 1→2: 100 XP
 * - Level 2→3: 150 XP
 * - Level 3→4: 225 XP
 * - Growth is exponential to maintain long-term challenge
 * 
 * Streak Logic:
 * - Increments if action on consecutive day
 * - Resets to 1 if gap > 1 day
 * - Multiple actions in same day don't increment
 * 
 * Persistence:
 * - State saved to localStorage
 * - Syncs across tabs automatically
 * 
 * @returns {Object} Gamification state and actions
 */
export const useGamification = () => {
    // Initialize from localStorage or use defaults
    // Allows gamification progress to persist across sessions
    const [state, setState] = useState<GamificationState>(() => {
        const saved = localStorage.getItem('flowai_gamification');
        return saved ? JSON.parse(saved) : {
            streak: 0,
            lastActionDate: null,
            level: 1,
            xp: 0,
            xpToNextLevel: 100  // Initial XP requirement
        };
    });

    // Persist state to localStorage on every change
    // Enables progress tracking across browser sessions
    useEffect(() => {
        localStorage.setItem('flowai_gamification', JSON.stringify(state));
    }, [state]);

    /**
     * Award XP and update streak for user actions
     * 
     * Handles:
     * 1. Streak calculation (consecutive days)
     * 2. XP award based on action type
     * 3. Level-up detection and celebration
     * 4. Sound feedback
     * 
     * @param actionType - Type of action performed
     */
    const performAction = (actionType: 'generate' | 'remix' | 'share') => {
        const today = new Date().toDateString();
        const lastDate = state.lastActionDate ? new Date(state.lastActionDate).toDateString() : null;

        let newStreak = state.streak;
        let xpGain = 0;

        // Streak Logic: Only increment on NEW days
        if (lastDate !== today) {
            // Check if yesterday (consecutive)
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (lastDate === yesterday) {
                // Consecutive day action - increment streak!
                newStreak += 1;
                playSound('streak');
                toast.success(`🔥 Streak increased! ${newStreak} days on fire!`);
            } else if (lastDate && lastDate !== today) {
                // Streak broken (gap > 1 day)
                newStreak = 1;
                toast.info("Streak reset. Let's build it back up!");
            } else {
                // First action ever
                if (!state.lastActionDate) newStreak = 1;
            }
        }
        // If same day, streak stays the same (no double-counting)

        // XP rewards by action type
        // More complex actions award more points
        switch (actionType) {
            case 'generate': xpGain = 10; break;  // Base content creation
            case 'remix': xpGain = 15; break;     // Iterating on content
            case 'share': xpGain = 20; break;     // Publishing/distribution
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
