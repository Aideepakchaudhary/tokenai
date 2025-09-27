import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Monitor } from "lucide-react";

interface DemoShowcaseProps {
  onManualMode: () => void;
}

export function DemoShowcase({ onManualMode }: DemoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const demoQueries = [
    {
      query: "Show me the top 10 AI tokens by holder count",
      chain: "Ethereum",
      description: "Analyzing AI token ecosystem and community size",
      results: "Found 2,345 AI tokens, showing top performers by holder metrics"
    },
    {
      query: "Track whale movements for FET in the last 24 hours",
      chain: "Ethereum", 
      description: "Monitoring large Fetch.ai token transfers",
      results: "Detected 12 whale transactions totaling 15.2M FET tokens"
    },
    {
      query: "Compare token distribution between RNDR and FET",
      chain: "Ethereum",
      description: "Comparative analysis of holder distribution patterns",
      results: "RNDR shows higher concentration, FET has broader distribution"
    },
    {
      query: "Alert me when a whale moves more than 1M tokens",
      chain: "Polygon",
      description: "Real-time whale movement monitoring setup",
      results: "Alert system configured for 1M+ token movements"
    }
  ];

  const queryDuration = 8000; // 8 seconds per query

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentQueryIndex((current) => (current + 1) % demoQueries.length);
            return 0;
          }
          return prev + (100 / (queryDuration / 100));
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentQueryIndex]);

  const currentQuery = demoQueries[currentQueryIndex];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentQueryIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen pt-24 network-bg">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Demo Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Monitor className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-gradient">Demo Showcase</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Automated demonstration of TokenAI capabilities
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                className="btn-ghost-neon"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <Button
                variant="outline"
                className="btn-ghost-neon"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button
                className="btn-neon"
                onClick={onManualMode}
              >
                Switch to Manual Mode
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="glass-card p-6 mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Demo Progress</h3>
              <Badge variant="secondary">
                Query {currentQueryIndex + 1} of {demoQueries.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {demoQueries.map((_, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded ${
                    index === currentQueryIndex
                      ? "bg-primary text-primary-foreground"
                      : index < currentQueryIndex
                      ? "bg-accent/20 text-accent"
                      : "bg-muted/20"
                  }`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Current Query Display */}
          <Card className="glass-card mb-8 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Current Query</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  {currentQuery.chain}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/20 border-l-4 border-primary">
                  <p className="text-lg font-medium italic">"{currentQuery.query}"</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-primary">Processing:</h4>
                    <p className="text-muted-foreground">{currentQuery.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-accent">Results:</h4>
                    <p className="text-muted-foreground">{currentQuery.results}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mock Results Preview */}
          <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Tokens Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">2,345</div>
                <p className="text-sm text-muted-foreground">Across 6 chains</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Whale Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">47</div>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-2">$12.4M</div>
                <p className="text-sm text-muted-foreground">Token transfers</p>
              </CardContent>
            </Card>
          </div>

          {/* Query Queue */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Demo Queue</h3>
            <div className="space-y-3">
              {demoQueries.map((query, index) => (
                <div
                  key={index}
                  className={`glass-card p-4 transition-all ${
                    index === currentQueryIndex
                      ? "glow-purple border-primary"
                      : index < currentQueryIndex
                      ? "opacity-60 bg-accent/10"
                      : "opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === currentQueryIndex
                          ? "bg-primary text-primary-foreground"
                          : index < currentQueryIndex
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <span className={index === currentQueryIndex ? "text-primary font-medium" : ""}>
                        {query.query}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {query.chain}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}