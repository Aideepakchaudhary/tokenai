import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, TrendingUp, TrendingDown, Users, DollarSign, AlertCircle } from "lucide-react";
import { TokenBalance } from "@/lib/types";

interface ResultsDashboardProps {
  query: string;
  chain: string;
  onNewQuery: () => void;
}

export function ResultsDashboard({ query, chain, onNewQuery }: ResultsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  const mockTransfers = [
    {
      hash: "0x1a2b3c...",
      from: "0x742d...c123",
      to: "0x8f9e...d456",
      amount: "1,500,000 FET",
      timestamp: "2 mins ago",
      type: "whale"
    },
    {
      hash: "0x4d5e6f...",
      from: "0x123a...b789",
      to: "0x456c...e012",
      amount: "250,000 RNDR",
      timestamp: "5 mins ago",
      type: "large"
    },
    {
      hash: "0x7g8h9i...",
      from: "0x789d...f345",
      to: "0x012g...h678",
      amount: "50,000 OCEAN",
      timestamp: "8 mins ago",
      type: "normal"
    }
  ];

  // Helper function to extract wallet address from query
  const extractWalletAddress = (query: string): string | null => {
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = query.match(addressRegex);
    return matches ? matches[0] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if query contains a wallet address for portfolio analysis
        const walletAddress = extractWalletAddress(query);
        
        if (walletAddress) {
          // Fetch portfolio data for wallet analysis
          const response = await fetch(`http://localhost:3001/api/portfolio?wallet=${encodeURIComponent(walletAddress)}&chain=${chain}`);
          const result = await response.json();
          
          if (result.success) {
            setPortfolioData(result.data);
            setTokens(result.data.tokens.slice(0, 8)); // Show top 8 tokens
          } else {
            setError(result.error || 'Failed to fetch portfolio data');
          }
        } else {
          // For non-wallet queries, show a message that this requires wallet analysis
          setError('This demo requires a wallet address. Try: "Analyze wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, chain]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 network-bg flex items-center justify-center">
        <div className="glass-card p-12 text-center animate-pulse-glow">
          <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-2xl font-bold mb-2">Processing Query...</h3>
          <p className="text-muted-foreground">Fetching data from The Graph Token API on {chain}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 network-bg flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Query Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button className="btn-neon" onClick={onNewQuery}>
            Try New Query
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 network-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Portfolio Analysis</h1>
              <p className="text-muted-foreground italic">"{query}"</p>
              {portfolioData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-lg font-semibold">${portfolioData.totalValueUSD.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Token Count</p>
                    <p className="text-lg font-semibold">{portfolioData.tokenCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diversity Score</p>
                    <p className="text-lg font-semibold">{portfolioData.diversityScore}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Health</p>
                    <p className="text-lg font-semibold capitalize">{portfolioData.portfolioHealth}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="btn-ghost-neon">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="btn-neon" onClick={onNewQuery}>
                New Query
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="tokens" className="data-[state=active]:bg-primary/20">
              Token Overview
            </TabsTrigger>
            <TabsTrigger value="transfers" className="data-[state=active]:bg-primary/20">
              Transfers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-6">
            {/* Token Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tokens.map((token, index) => {
                const tokenValue = token.value;
                const tokenBalance = (parseFloat(token.amount) / Math.pow(10, token.decimals)).toFixed(4);
                const isPositive = Math.random() > 0.5; // Mock positive/negative since we don't have real price change data
                
                return (
                  <Card key={index} className="glass-card group hover:glow-purple transition-all animate-slide-up">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{token.symbol}</CardTitle>
                          <p className="text-sm text-muted-foreground">{token.name}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">${tokenValue.toLocaleString()}</span>
                          <div className={`flex items-center gap-1 ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="text-sm font-medium">
                              {isPositive ? '+' : '-'}{(Math.random() * 20).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Balance</p>
                              <p className="font-medium">{tokenBalance}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Network</p>
                              <p className="font-medium uppercase">{token.network_id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            <Card className="glass-card animate-slide-up">
              <CardHeader>
                <CardTitle>Recent Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransfers.map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={transfer.type === 'whale' ? 'default' : transfer.type === 'large' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {transfer.type}
                          </Badge>
                          <span className="font-mono text-sm text-muted-foreground">{transfer.hash}</span>
                        </div>
                        <p className="text-sm">
                          <span className="font-mono">{transfer.from}</span> → <span className="font-mono">{transfer.to}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{transfer.amount}</p>
                        <p className="text-sm text-muted-foreground">{transfer.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card animate-slide-up">
                <CardHeader>
                  <CardTitle>Price Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card animate-slide-up">
                <CardHeader>
                  <CardTitle>Whale Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Whale tracking chart would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}