import { useEffect, useState } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@/components/ui/command'; // Assuming shadcn/ui command exists or we mock it
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Video,
    Zap,
    LayoutDashboard,
    MessageSquare
} from 'lucide-react';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Custom implementation if shadcn command is not fully set up
export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const { playSound } = useSoundEffects();
    const [search, setSearch] = useState("");

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
                playSound('hover');
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [playSound]);

    const handleSelect = (action: () => void) => {
        playSound('click');
        action();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 gap-0 bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden shadow-2xl shadow-purple-900/20 max-w-xl">
                <div className="flex items-center border-b border-zinc-800 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            playSound('typing');
                        }}
                    />
                    <div className="text-xs text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">ESC</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {!search && <p className="text-xs text-zinc-500 px-2 py-2">Suggestions</p>}

                    <div className="space-y-1">
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                            onClick={() => handleSelect(() => console.log("Go to Dashboard"))}
                            onMouseEnter={() => playSound('hover')}
                        >
                            <LayoutDashboard className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                            <span>Go to Dashboard</span>
                            <span className="ml-auto text-xs text-zinc-600">G D</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                            onClick={() => handleSelect(() => console.log("New Project"))}
                            onMouseEnter={() => playSound('hover')}
                        >
                            <Video className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                            <span>Create New Project</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                            onClick={() => handleSelect(() => console.log("Wallet"))}
                            onMouseEnter={() => playSound('hover')}
                        >
                            <CreditCard className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                            <span>View Wallet</span>
                            <span className="ml-auto text-xs text-zinc-600">G W</span>
                        </div>
                    </div>

                    <div className="my-2 border-t border-zinc-800" />
                    <p className="text-xs text-zinc-500 px-2 py-2">System</p>

                    <div className="space-y-1">
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                            onClick={() => handleSelect(() => console.log("Toggle Theme"))}
                            onMouseEnter={() => playSound('hover')}
                        >
                            <Zap className="w-4 h-4 text-zinc-500 group-hover:text-yellow-400" />
                            <span>Toggle Cyberpunk Mode</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group"
                            onClick={() => handleSelect(() => console.log("Settings"))}
                            onMouseEnter={() => playSound('hover')}
                        >
                            <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                            <span>Settings</span>
                        </div>
                    </div>
                </div>
                <div className="border-t border-zinc-800 p-2 bg-zinc-900/50 flex justify-between items-center text-[10px] text-zinc-500">
                    <span>FlowAI Command v1.0</span>
                    <div className="flex gap-2">
                        <span>Navigate <kbd className="bg-zinc-800 px-1 rounded">↓</kbd> <kbd className="bg-zinc-800 px-1 rounded">↑</kbd></span>
                        <span>Select <kbd className="bg-zinc-800 px-1 rounded">↵</kbd></span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
