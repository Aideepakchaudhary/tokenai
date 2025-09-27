import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Search, Sparkles } from "lucide-react";

interface QueryInputProps {
  onRunQuery: (query: string, chain: string) => void;
}

export function QueryInput({ onRunQuery }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("ethereum");

  const prebuiltQueries = [
    "Show me the top 10 AI tokens by holder count",
    "Track whale movements for FET in the last 24 hours",
    "Compare token distribution between RNDR and FET",
    "Alert me when a whale moves more than 1M tokens"
  ];

  const chains = [
    { value: "ethereum", label: "Ethereum", icon: "⟠" },
    { value: "arbitrum", label: "Arbitrum", icon: "🔵" },
    { value: "polygon", label: "Polygon", icon: "🔷" },
    { value: "optimism", label: "Optimism", icon: "🔴" },
    { value: "base", label: "Base", icon: "🟦" },
    { value: "bsc", label: "BSC", icon: "🟡" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onRunQuery(query, selectedChain);
    }
  };

  const handlePrebuiltQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    onRunQuery(selectedQuery, selectedChain);
  };

  return (
    <div className="min-h-screen pt-24 network-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Ask Anything</span> About Tokens
            </h1>
            <p className="text-xl text-muted-foreground">
              Natural language queries powered by LangChain + The Graph Token API
            </p>
          </div>

          {/* Main Query Input */}
          <div className="glass-card p-8 mb-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about tokens..."
                  className="text-lg p-6 pr-16 bg-muted/50 border-border/50 focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-primary"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Select Chain
                  </label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      {chains.map((chain) => (
                        <SelectItem key={chain.value} value={chain.value}>
                          <div className="flex items-center gap-2">
                            <span>{chain.icon}</span>
                            <span>{chain.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  className="btn-neon px-8 py-3"
                  disabled={!query.trim()}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Run Query
                </Button>
              </div>
            </form>
          </div>

          {/* Pre-built Queries */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-xl font-semibold">Try these examples:</h3>
            </div>
            
            <div className="grid gap-4">
              {prebuiltQueries.map((prebuiltQuery, index) => (
                <button
                  key={index}
                  onClick={() => handlePrebuiltQuery(prebuiltQuery)}
                  className="glass-card p-4 text-left hover:glow-blue transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {prebuiltQuery}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      Try it
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}