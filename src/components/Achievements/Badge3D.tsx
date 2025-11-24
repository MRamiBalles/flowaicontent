import { useRef, useState } from 'react';
import { Trophy } from 'lucide-react';

export const Badge3D = ({ title = "Early Adopter" }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -20; // Max rotation deg
        const rotateY = ((x - centerX) / centerX) * 20;

        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            className="perspective-1000 w-32 h-32 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={cardRef}
                className="w-full h-full relative preserve-3d transition-transform duration-200 ease-out"
                style={{
                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                    transformStyle: 'preserve-3d'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 backdrop-blur-md shadow-xl flex flex-col items-center justify-center gap-2 group">
                    <div className="transform translate-z-10 group-hover:translate-z-20 transition-transform duration-300">
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg shadow-orange-500/50">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider transform translate-z-5 group-hover:translate-z-10 transition-transform duration-300">
                        {title}
                    </span>

                    {/* Holographic Shine */}
                    <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
