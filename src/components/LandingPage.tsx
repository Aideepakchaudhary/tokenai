import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const chains = [
    { name: "Ethereum", symbol: "ETH" },
    { name: "Polygon", symbol: "MATIC" },
    { name: "Arbitrum", symbol: "ARB" },
    { name: "Optimism", symbol: "OP" },
    { name: "Base", symbol: "BASE" },
    { name: "BSC", symbol: "BNB" }
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Queries",
      description: "Ask questions in natural language and get instant insights"
    },
    {
      icon: Zap,
      title: "Real-Time Data",
      description: "Live blockchain data from The Graph Token API"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Whale tracking, token distribution, and price analysis"
    }
  ];

  return (
    <div className="min-h-screen network-bg relative overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto animate-slide-up">
          <Badge variant="secondary" className="mb-6 text-lg px-6 py-2">
            🚀 ETHGlobal New Delhi
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-gradient">The Graph Token API</span>
            <br />
            <span className="text-foreground">is Real and Perfect</span>
            <br />
            <span className="text-gradient">for ETHGlobal!</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Ask anything about tokens and get instant insights powered by AI + The Graph.
            Natural language queries meet live blockchain data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="btn-neon text-lg px-8 py-4 font-semibold"
              onClick={onGetStarted}
            >
              Try a Demo Query
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="btn-ghost-neon text-lg px-8 py-4"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 text-center group hover:glow-purple transition-all duration-300"
            >
              <feature.icon className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Supported Chains */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8 text-gradient">Supported Chains</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {chains.map((chain, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-lg px-6 py-3 glass-card hover:glow-blue transition-all cursor-pointer"
              >
                {chain.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-primary rounded-full animate-float opacity-60"></div>
      <div className="absolute top-40 right-32 w-3 h-3 bg-secondary rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-accent rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-20 w-4 h-4 bg-primary rounded-full animate-float opacity-30" style={{ animationDelay: '3s' }}></div>
    </div>
  );
}