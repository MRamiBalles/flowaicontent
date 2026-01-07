import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calculator, Sparkles } from "lucide-react";

interface Platform {
  name: string;
  split: number;
  color: string;
}

const platforms: Platform[] = [
  { name: "FlowAI", split: 0.95, color: "bg-emerald-500" },
  { name: "Kick", split: 0.95, color: "bg-green-500" },
  { name: "YouTube", split: 0.70, color: "bg-red-500" },
  { name: "Twitch", split: 0.50, color: "bg-purple-500" },
];

export const RevenueCalculator = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000);

  const calculateEarnings = (revenue: number, split: number) => {
    return revenue * split;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const flowAIEarnings = calculateEarnings(monthlyRevenue, 0.95);
  const twitchEarnings = calculateEarnings(monthlyRevenue, 0.50);
  const yearlyDifference = (flowAIEarnings - twitchEarnings) * 12;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Revenue Calculator</CardTitle>
              <p className="text-xs text-muted-foreground">
                See how much more you'd earn on FlowAI
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300">
            <Sparkles className="w-3 h-3 mr-1" />
            95/5 Split
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Gross Revenue</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(monthlyRevenue)}
            </span>
          </div>
          <Slider
            value={[monthlyRevenue]}
            onValueChange={(value) => setMonthlyRevenue(value[0])}
            min={100}
            max={50000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$100</span>
            <span>$50,000</span>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-3">
          {platforms.map((platform) => {
            const earnings = calculateEarnings(monthlyRevenue, platform.split);
            const percentage = (earnings / monthlyRevenue) * 100;
            const isFlowAI = platform.name === "FlowAI";

            return (
              <div key={platform.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${platform.color}`} />
                    <span className={`text-sm ${isFlowAI ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {platform.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(platform.split * 100)}%)
                    </span>
                  </div>
                  <span className={`font-bold ${isFlowAI ? 'text-emerald-400' : ''}`}>
                    {formatCurrency(earnings)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${platform.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Savings Highlight */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                You'd earn <span className="text-emerald-400 font-bold">{formatCurrency(yearlyDifference)}</span> more per year
              </p>
              <p className="text-xs text-muted-foreground">
                vs Twitch (50% split)
              </p>
            </div>
          </div>
        </div>

        {/* AI Bonus */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Plus: AI tools to create content 10x faster = more revenue potential
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueCalculator;
