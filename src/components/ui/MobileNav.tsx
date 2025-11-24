import { Home, Video, Users, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const location = useLocation();

    const items = [
        {
            title: "Home",
            href: "/",
            icon: Home,
        },
        {
            title: "Studio",
            href: "/video-studio",
            icon: Video,
        },
        {
            title: "Co-Stream",
            href: "/co-stream",
            icon: Users,
        },
        {
            title: "Market",
            href: "/marketplace",
            icon: ShoppingBag,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg z-50 pb-safe">
            <nav className="flex justify-around items-center h-16">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                            location.pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
