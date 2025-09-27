// Base API Response Interface
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
  requestDuration?: number;
  error?: string;
}

// Token Data from The Graph Token API
export interface TokenBalance {
  block_num: number;
  last_balance_update: string;
  contract: string;
  amount: string;
  value: number;
  name: string;
  symbol: string;
  decimals: number;
  network_id: string;
}

export interface TokenHolder {
  block_num: number;
  last_balance_update: string;
  address: string;
  amount: string;
  value: number;
  name: string;
  decimals: number;
  symbol: string;
  network_id: string;
}

// Portfolio Analysis Types
export interface PortfolioAnalysis {
  walletAddress: string;
  totalValueUSD: number;
  tokenCount: number;
  topHolding: {
    symbol: string;
    name: string;
    valueUSD: number;
    percentage: string;
  };
  diversityScore: number;
  portfolioHealth: 'concentrated' | 'moderate' | 'diversified';
  sectorBreakdown: Record<string, {
    valueUSD: number;
    percentage: string;
  }>;
  lastActivity: string;
  tokens: TokenBalance[];
  aiInsights: string[];
}

// Whale Analysis Types
export interface WhaleAnalysis {
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  totalHolders: number;
  whales: WhaleHolder[];
  alerts: string[];
  analysis: {
    whaleConcentration: 'low' | 'medium' | 'high' | 'very_high';
    riskAssessment: string;
  };
}

export interface WhaleHolder {
  rank: number;
  address: string;
  balance: string;
  balanceFormatted: string;
  percentOfSupply: number;
  valueUSD: number;
  walletType: 'Exchange' | 'Individual' | 'Contract';
  label: string;
  recentActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Token Discovery Types
export interface TokenDiscovery {
  category: string;
  tokens: DiscoveredToken[];
  summary: string;
  methodology: string;
}

export interface DiscoveredToken {
  address: string;
  symbol: string;
  name: string;
  trendingScore: number;
  whyTrending: string;
  confidence: 'low' | 'medium' | 'high';
  whaleHolders: number;
  totalWhaleValue: number;
}

// Wallet Comparison Types
export interface WalletComparison {
  wallets: Array<{
    address: string;
    totalValueUSD: number;
  }>;
  analysis: {
    similarity: number;
    commonTokens: string[];
    uniqueToWallet1: string[];
    uniqueToWallet2: string[];
    insights: string[];
  };
  recommendations: string[];
}

// Token Intelligence Types
export interface TokenIntelligence {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  metrics: {
    totalHolders: number;
    whaleConcentration: string;
    distributionHealth: string;
    liquidityScore: number;
    riskScore: number;
  };
  distribution: {
    top10Percentage: number;
    whaleCount: number;
    retailHolders: number;
  };
  aiInsights: string[];
  category: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any; // For structured data responses
  loading?: boolean;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// LangChain Tool Types
export interface ToolResponse {
  summary: string;
  insights: string[];
  metrics: Record<string, any>;
  visualizations?: Array<{
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    data: ChartData;
    title: string;
  }>;
  sources: string[];
}

// Alert Types (for mocked data)
export interface Alert {
  id: string;
  type: 'whale_movement' | 'coordinated_activity' | 'unusual_volume';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, any>;
  riskImpact: string;
  timestamp: string;
}

// Trending Token Types (for mocked data)
export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  trendingScore: number;
  whyTrending: string;
  confidence: 'low' | 'medium' | 'high';
  change24h: number;
  volume24hUSD: number;
  marketCapUSD?: number;
}

// Utility Types
export type SectorType = 'AI/ML' | 'DeFi' | 'Layer 1' | 'Memes' | 'Gaming' | 'Other';
export type ChainType = 'ethereum' | 'arbitrum' | 'polygon' | 'optimism' | 'base' | 'bsc';
export type TimeframeType = '1h' | '24h' | '7d' | '30d';