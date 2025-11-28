import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video, Coins, TrendingUp, Users, Zap, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center glass-panel fixed top-0 z-50 border-b-0 rounded-none bg-black/20 backdrop-blur-lg">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">FlowAI</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth")} className="text-white hover:text-white hover:bg-white/10">
            Login
          </Button>
          <Button onClick={() => navigate("/auth")} className="gradient-primary border-0">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background -z-10" />
        
        <div className="animate-in-up" style={{ animationDelay: "0.1s" }}>
          <span className="px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6 inline-block backdrop-blur-sm">
            🚀 The Future of Content Creation
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl animate-in-up" style={{ animationDelay: "0.2s" }}>
          Unleash Your <br />
          <span className="text-gradient">Creative Flow</span> with AI
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-10 animate-in-up" style={{ animationDelay: "0.3s" }}>
          The world's first platform combining AI video generation, viral social mechanics, and a decentralized token economy.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in-up" style={{ animationDelay: "0.4s" }}>
          <Button size="lg" onClick={() => navigate("/auth")} className="gradient-primary text-lg h-12 px-8">
            Start Creating <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="glass-card text-lg h-12 px-8 hover:bg-white/5">
            View Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 animate-in-up" style={{ animationDelay: "0.5s" }}>
          {[
            { label: "Active Creators", value: "10k+" },
            { label: "Videos Generated", value: "1M+" },
            { label: "Creator Earnings", value: "$500k+" },
            { label: "Community", value: "50k+" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 md:px-12 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to help you create, grow, and monetize your content like never before.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="w-8 h-8 text-purple-400" />,
                title: "AI Video Studio",
                desc: "Generate professional videos from text in seconds using our advanced Stable Diffusion models."
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-pink-400" />,
                title: "Viral Mechanics",
                desc: "Built-in growth tools, gamified streaks, and social sharing to boost your reach."
              },
              {
                icon: <Coins className="w-8 h-8 text-yellow-400" />,
                title: "Token Economy",
                desc: "Earn $FLOW tokens for your content and trade assets in our decentralized marketplace."
              },
              {
                icon: <Users className="w-8 h-8 text-blue-400" />,
                title: "Co-Streaming",
                desc: "Collaborate with other creators in real-time with AI-matched raids and events."
              },
              {
                icon: <Shield className="w-8 h-8 text-green-400" />,
                title: "Content Safety",
                desc: "Enterprise-grade moderation and deepfake detection to keep your community safe."
              },
              {
                icon: <Zap className="w-8 h-8 text-orange-400" />,
                title: "Instant Monetization",
                desc: "Start earning from day one with subscriptions, tips, and creator coins."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="mb-6 p-3 bg-white/5 rounded-xl w-fit">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black/40 text-center text-muted-foreground">
        <p>© 2024 FlowAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
