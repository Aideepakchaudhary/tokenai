import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, TrendingUp, AlertTriangle, Shield, Eye, Star, StarOff } from "lucide-react";
import { WhaleAlerts } from "./WhaleAlerts";

interface WhaleHolder {
  address: string;
  balance: string;
  balanceUSD: number;
  percentage: number;
  whaleType: 'mega' | 'large' | 'medium' | 'small';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  lastActivity?: string;
}

interface WhaleAnalysis {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  whaleCount: number;
  whaleConcentration: number;
  riskScore: number;
  distributionHealth: 'healthy' | 'concerning' | 'risky' | 'critical';
  topWhales: WhaleHolder[];
  insights: string[];
}

export function WhaleTracker() {
  const [tokenInput, setTokenInput] = useState('');
  const [whaleData, setWhaleData] = useState<WhaleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [followedWhales, setFollowedWhales] = useState<Set<string>>(new Set());

  const commonTokens = [
    { symbol: 'COMP', name: 'Compound', status: '✅ Working' },
    { symbol: 'UNI', name: 'Uniswap', status: '✅ Working' },
    { symbol: 'LINK', name: 'Chainlink', status: '⚠️ Limited Data' },
    { symbol: 'USDC', name: 'USD Coin', status: '⚠️ Limited Data' }
  ];

  // Load followed whales from localStorage
  useEffect(() => {
    const savedFollows = localStorage.getItem('followedWhales');
    if (savedFollows) {
      setFollowedWhales(new Set(JSON.parse(savedFollows)));
    }
  }, []);

  // Save followed whales to localStorage
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

  const handleAnalyzeWhales = async (token: string) => {
    if (!token.trim()) return;
    
    setIsLoading(true);
    setError('');
    setTokenInput(token);

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Show me ${token} whales`,
          chain: 'ethereum'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Parse the AI response to extract whale data
        // This is a simplified version - in production, you might want to call the whale API directly
        
        setWhaleData({
          tokenAddress: '',
          tokenSymbol: token.toUpperCase(),
          tokenName: token,
          whaleCount: 0,
          whaleConcentration: 0,
          riskScore: 0,
          distributionHealth: 'healthy',
          topWhales: [],
          insights: [result.data.content]
        });
      } else {
        setError(result.error || 'Failed to analyze whales');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getWhaleTypeColor = (type: string) => {
    switch (type) {
      case 'mega': return 'bg-red-100 text-red-800 border-red-200';
      case 'large': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'critical': return 'text-red-600';
      case 'risky': return 'text-orange-600';
      case 'concerning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="min-h-screen pt-24 network-bg">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="flex justify-between items-start mb-8">
              <div></div> {/* Spacer */}
              <div className="text-center flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-gradient">🐋 Whale Tracker</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Analyze token whale holders and distribution risks
                </p>
              </div>
              {/* Whale Alerts */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Following: {followedWhales.size}
                </Badge>
                <WhaleAlerts followedWhales={followedWhales} />
              </div>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter token symbol (UNI, USDC) or address (0x...)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeWhales(tokenInput)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAnalyzeWhales(tokenInput)}
                  disabled={isLoading}
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Access Tokens */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {commonTokens.map((token) => (
                <Button
                  key={token.symbol}
                  variant={token.status.includes('Working') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAnalyzeWhales(token.symbol)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token.symbol}</span>
                    <span className="text-xs">{token.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{token.name}</span>
                </Button>
              ))}
            </div>
            
            {/* Data Quality Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="text-sm text-blue-800">
                <span className="font-semibold">📊 Data Quality:</span> Our system filters out corrupted data from The Graph API. 
                Tokens marked ✅ have reliable whale data. Others may show limited results due to data quality issues.
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="glass-card mb-8">
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing whale holders...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {whaleData && !isLoading && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">{whaleData.whaleCount}</div>
                    <div className="text-sm text-muted-foreground">Whale Holders</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {whaleData.whaleConcentration.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Top 10 Control</div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {whaleData.riskScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-6 text-center">
                    <div className={`text-2xl font-bold ${getHealthColor(whaleData.distributionHealth)}`}>
                      {whaleData.distributionHealth.charAt(0).toUpperCase() + whaleData.distributionHealth.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Health Status</div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {whaleData.insights.map((insight, index) => (
                      <p key={index} className="text-sm leading-relaxed mb-4 last:mb-0">
                        {insight}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Whales List */}
              {whaleData.topWhales && whaleData.topWhales.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🐋</span>
                      Top Whale Holders ({whaleData.topWhales.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {whaleData.topWhales.slice(0, 10).map((whale: any, index: number) => {
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
                          <Card key={whale.address} className="border hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">{getWhaleIcon(whale.whaleType)}</div>
                                  <div>
                                    <div className="font-mono text-sm font-semibold">
                                      {whale.address.slice(0, 8)}...{whale.address.slice(-6)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge 
                                        variant="outline" 
                                        className={getWhaleTypeColor(whale.whaleType)}
                                      >
                                        {whale.whaleType.charAt(0).toUpperCase() + whale.whaleType.slice(1)} Whale
                                      </Badge>
                                      <span className={`text-xs ${getRiskColor(whale.riskLevel || 'low')}`}>
                                        {whale.riskLevel || 'low'} risk
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-lg font-bold">
                                      {whale.percentage.toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {whale.balanceUSD > 0 ? `$${whale.balanceUSD.toLocaleString()}` : whale.balance}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={followedWhales.has(whale.address) ? "default" : "outline"}
                                    onClick={() => toggleFollowWhale(whale.address)}
                                    className="h-8 w-8 p-0"
                                    title={followedWhales.has(whale.address) ? "Unfollow whale" : "Follow whale"}
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
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <Card className="glass-card border-blue-200 bg-blue-50/50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Want More Detailed Analysis?</h3>
                  <p className="text-muted-foreground mb-4">
                    Use our AI Chat for interactive whale analysis and follow specific whales
                  </p>
                  <Button className="mr-2">
                    <Eye className="w-4 h-4 mr-2" />
                    Open Chat Mode
                  </Button>
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Set Whale Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}