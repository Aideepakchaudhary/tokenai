import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, TrendingUp, TrendingDown, Users, DollarSign, AlertCircle, Star, StarOff, Activity } from "lucide-react";
import { TokenBalance } from "@/lib/types";
import { WhaleAlerts } from "./WhaleAlerts";

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
  const [whaleData, setWhaleData] = useState<any>(null);
  const [queryType, setQueryType] = useState<'wallet' | 'whale' | 'unknown'>('unknown');
  const [followedWhales, setFollowedWhales] = useState<Set<string>>(new Set());

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

  // Helper function to detect query type
  const detectQueryType = (query: string): 'wallet' | 'whale' | 'unknown' => {
    const lowerQuery = query.toLowerCase();
    const hasAddress = extractWalletAddress(query);
    
    if (!hasAddress) return 'unknown';
    
    // Whale-related keywords
    if (lowerQuery.includes('whale') || 
        lowerQuery.includes('holder') || 
        lowerQuery.includes('distribution') ||
        lowerQuery.includes('biggest') ||
        lowerQuery.includes('top holders')) {
      return 'whale';
    }
    
    // Wallet-related keywords  
    if (lowerQuery.includes('wallet') || 
        lowerQuery.includes('portfolio') ||
        lowerQuery.includes('analyze') ||
        lowerQuery.includes('balance')) {
      return 'wallet';
    }
    
    return 'wallet'; // Default to wallet analysis
  };

  // Load followed whales from localStorage on component mount
  useEffect(() => {
    const savedFollows = localStorage.getItem('followedWhales');
    if (savedFollows) {
      setFollowedWhales(new Set(JSON.parse(savedFollows)));
    }
  }, []);

  // Save followed whales to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('followedWhales', JSON.stringify(Array.from(followedWhales)));
  }, [followedWhales]);

  const toggleFollowWhale = (address: string) => {
    const newFollows = new Set(followedWhales);
    if (newFollows.has(address)) {
      newFollows.delete(address);
    } else {
      newFollows.add(address);
    }
    setFollowedWhales(newFollows);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setPortfolioData(null);
      setWhaleData(null);
      
      try {
        const address = extractWalletAddress(query);
        const type = detectQueryType(query);
        setQueryType(type);
        
        if (address) {
          if (type === 'whale') {
            // Fetch whale analysis data
            const response = await fetch(`http://localhost:3001/api/whale/holders/${encodeURIComponent(address)}?chain=${chain}&limit=50`);
            const result = await response.json();
            
            if (result.success) {
              setWhaleData(result.data);
            } else {
              setError(result.error || 'Failed to fetch whale data');
            }
          } else {
            // Fetch portfolio data for wallet analysis
            const response = await fetch(`http://localhost:3001/api/portfolio?wallet=${encodeURIComponent(address)}&chain=${chain}`);
            const result = await response.json();
            
            if (result.success) {
              setPortfolioData(result.data);
              setTokens(result.data.tokens.slice(0, 8)); // Show top 8 tokens
            } else {
              setError(result.error || 'Failed to fetch portfolio data');
            }
          }
        } else {
          setError('Please provide a valid address. Try: "Analyze wallet 0x..." or "Whale analysis for token 0x..."');
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
              <h1 className="text-2xl font-bold mb-2">
                {queryType === 'whale' ? '🐋 Whale Analysis' : '📊 Portfolio Analysis'}
              </h1>
              <p className="text-muted-foreground italic">"{query}"</p>
              
              {/* Portfolio Data */}
              {portfolioData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-lg font-semibold">
                      {portfolioData.totalValueUSD >= 1 
                        ? `$${portfolioData.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : portfolioData.totalValueUSD >= 0.01
                        ? `$${portfolioData.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
                        : portfolioData.totalValueUSD > 0
                        ? `$${portfolioData.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })}`
                        : '$0.00'
                      }
                    </p>
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
              
              {/* Whale Data */}
              {whaleData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Token</p>
                    <p className="text-lg font-semibold">{whaleData.tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Whale Count</p>
                    <p className="text-lg font-semibold">{whaleData.whaleCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concentration</p>
                    <p className="text-lg font-semibold">{whaleData.whaleConcentration}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-lg font-semibold">{whaleData.riskScore}/100</p>
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
            <div className="flex gap-2 items-center">
              <WhaleAlerts followedWhales={followedWhales} />
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

        <Tabs defaultValue={queryType === 'whale' ? "whales" : "tokens"} className="space-y-6">
          <TabsList className="glass-card p-1">
            {queryType === 'whale' ? (
              <>
                <TabsTrigger value="whales" className="data-[state=active]:bg-primary/20">
                  🐋 Whale Holders
                </TabsTrigger>
                <TabsTrigger value="watchlist" className="data-[state=active]:bg-primary/20">
                  ⭐ Watchlist ({followedWhales.size})
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-primary/20">
                  💡 AI Insights
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">
                  📊 Analytics
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="tokens" className="data-[state=active]:bg-primary/20">
                  Token Overview
                </TabsTrigger>
                <TabsTrigger value="transfers" className="data-[state=active]:bg-primary/20">
                  Transfers
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">
                  Analytics
                </TabsTrigger>
              </>
            )}
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
                          <span className="text-2xl font-bold">
                            {tokenValue >= 1 
                              ? `$${tokenValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : tokenValue >= 0.01
                              ? `$${tokenValue.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
                              : tokenValue > 0
                              ? `$${tokenValue.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })}`
                              : '$0.00'
                            }
                          </span>
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

          {/* Whale Holders Tab */}
          <TabsContent value="whales" className="space-y-6">
            {whaleData && (
              <div className="space-y-6">
                {/* Whale Holders Grid */}
                <div className="grid gap-4">
                  {whaleData.topWhales.map((whale: any, index: number) => {
                    const getWhaleIcon = (type: string) => {
                      switch (type) {
                        case 'mega': return '🐋';
                        case 'large': return '🐳';
                        case 'medium': return '🐟';
                        default: return '🐠';
                      }
                    };

                    const getRiskColor = (risk: string) => {
                      switch (risk) {
                        case 'critical': return 'text-red-500';
                        case 'high': return 'text-orange-500';
                        case 'medium': return 'text-yellow-500';
                        case 'low': return 'text-green-500';
                        default: return 'text-gray-500';
                      }
                    };

                    return (
                      <Card key={whale.address} className="glass-card hover:glow-purple transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getWhaleIcon(whale.whaleType)}</div>
                              <div>
                                <div className="font-mono text-sm">
                                  {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {whale.whaleType}
                                  </Badge>
                                  <span className={`text-xs ${getRiskColor(whale.riskLevel || 'low')}`}>
                                    {whale.riskLevel} risk
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-semibold">{whale.percentage.toFixed(2)}%</div>
                                <div className="text-sm text-muted-foreground">
                                  ${whale.balanceUSD.toLocaleString()}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={followedWhales.has(whale.address) ? "default" : "outline"}
                                onClick={() => toggleFollowWhale(whale.address)}
                                className="h-8 w-8 p-0"
                              >
                                {followedWhales.has(whale.address) ? (
                                  <Star className="h-4 w-4 fill-current" />
                                ) : (
                                  <StarOff className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Whale Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Followed Whales ({followedWhales.size})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {followedWhales.size === 0 ? (
                  <div className="text-center py-8">
                    <StarOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Whales Followed</h3>
                    <p className="text-muted-foreground">
                      Start following whale addresses by clicking the star icon next to any whale holder.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from(followedWhales).map((address) => (
                      <Card key={address} className="glass-card hover:glow-purple transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">⭐</div>
                              <div>
                                <div className="font-mono text-sm">
                                  {address.slice(0, 6)}...{address.slice(-4)}
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  Followed Whale
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleFollowWhale(address)}
                                className="h-8 w-8 p-0"
                              >
                                <StarOff className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Whale Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {whaleData && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    AI Whale Analysis Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {whaleData.insights.map((insight: string, index: number) => (
                      <div key={index} className="p-4 bg-muted/20 rounded-lg border-l-4 border-primary/50">
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Distribution Health</h4>
                      <Badge 
                        variant={whaleData.distributionHealth === 'healthy' ? 'default' : 'destructive'}
                        className="text-sm"
                      >
                        {whaleData.distributionHealth}
                      </Badge>
                    </div>
                    <div className="p-4 bg-muted/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <div className="text-2xl font-bold">{whaleData.riskScore}/100</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}