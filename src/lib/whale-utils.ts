// Whale analysis utility functions

export interface WhaleHolder {
  address: string;
  balance: string;
  balanceUSD: number;
  percentage: number;
  whaleType: 'mega' | 'large' | 'medium' | 'small';
  firstSeen?: string;
  lastActivity?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface WhaleMovement {
  hash: string;
  from: string;
  to: string;
  amount: string;
  amountUSD: number;
  timestamp: string;
  movementType: 'accumulation' | 'distribution' | 'transfer';
  significance: 'whale' | 'large' | 'medium' | 'small';
}

export interface WhaleAnalysis {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: string;
  whaleCount: number;
  whaleConcentration: number;
  riskScore: number;
  distributionHealth: 'healthy' | 'concerning' | 'risky' | 'critical';
  topWhales: WhaleHolder[];
  recentMovements: WhaleMovement[];
  insights: string[];
}

// Whale classification based on percentage holdings
export const classifyWhale = (percentage: number): WhaleHolder['whaleType'] => {
  if (percentage >= 5) return 'mega';      // 5%+ = Mega Whale
  if (percentage >= 1) return 'large';     // 1-5% = Large Whale  
  if (percentage >= 0.1) return 'medium';  // 0.1-1% = Medium Whale
  return 'small';                          // <0.1% = Small Holder
};

// Calculate whale risk level based on holdings and activity
export const calculateWhaleRisk = (whale: WhaleHolder): WhaleHolder['riskLevel'] => {
  const { percentage, whaleType } = whale;
  
  if (whaleType === 'mega' && percentage > 10) return 'critical';
  if (whaleType === 'mega' || percentage > 5) return 'high';
  if (whaleType === 'large' || percentage > 1) return 'medium';
  return 'low';
};

// Calculate overall distribution risk score (0-100)
export const calculateDistributionRisk = (whales: WhaleHolder[]): number => {
  const top10Percentage = whales.slice(0, 10).reduce((sum, whale) => sum + whale.percentage, 0);
  const top5Percentage = whales.slice(0, 5).reduce((sum, whale) => sum + whale.percentage, 0);
  const megaWhales = whales.filter(w => w.whaleType === 'mega').length;
  
  let riskScore = 0;
  
  // Top 10 holders concentration
  if (top10Percentage > 60) riskScore += 40;
  else if (top10Percentage > 40) riskScore += 30;
  else if (top10Percentage > 25) riskScore += 20;
  else if (top10Percentage > 15) riskScore += 10;
  
  // Top 5 holders concentration
  if (top5Percentage > 40) riskScore += 30;
  else if (top5Percentage > 25) riskScore += 20;
  else if (top5Percentage > 15) riskScore += 10;
  
  // Mega whale count
  if (megaWhales > 3) riskScore += 20;
  else if (megaWhales > 1) riskScore += 10;
  
  // Single whale dominance
  const topWhale = whales[0];
  if (topWhale && topWhale.percentage > 20) riskScore += 10;
  
  return Math.min(riskScore, 100);
};

// Determine distribution health
export const getDistributionHealth = (riskScore: number): WhaleAnalysis['distributionHealth'] => {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'risky';
  if (riskScore >= 40) return 'concerning';
  return 'healthy';
};

// Generate whale analysis insights
export const generateWhaleInsights = (analysis: Partial<WhaleAnalysis>): string[] => {
  const insights: string[] = [];
  const { whaleCount, whaleConcentration, riskScore, topWhales } = analysis;
  
  if (!whaleCount || !whaleConcentration || !riskScore || !topWhales) {
    return ['Insufficient data for whale analysis'];
  }
  
  // Concentration insights
  if (whaleConcentration > 50) {
    insights.push(`🚨 High whale concentration: Top 10 holders control ${whaleConcentration.toFixed(1)}% of supply`);
  } else if (whaleConcentration > 30) {
    insights.push(`⚠️ Moderate whale concentration: Top 10 holders control ${whaleConcentration.toFixed(1)}% of supply`);
  } else {
    insights.push(`✅ Healthy distribution: Top 10 holders control ${whaleConcentration.toFixed(1)}% of supply`);
  }
  
  // Whale count insights
  if (whaleCount > 20) {
    insights.push(`📈 Strong institutional interest with ${whaleCount} significant holders`);
  } else if (whaleCount > 10) {
    insights.push(`📊 Moderate whale activity with ${whaleCount} significant holders`);
  } else if (whaleCount > 5) {
    insights.push(`👥 Limited whale presence with ${whaleCount} significant holders`);
  } else {
    insights.push(`⚡ Very few large holders - high volatility risk`);
  }
  
  // Top whale analysis
  const topWhale = topWhales[0];
  if (topWhale) {
    if (topWhale.percentage > 15) {
      insights.push(`🐋 Single mega whale dominance: Top holder owns ${topWhale.percentage.toFixed(1)}%`);
    } else if (topWhale.percentage > 5) {
      insights.push(`🐳 Large whale presence: Top holder owns ${topWhale.percentage.toFixed(1)}%`);
    }
  }
  
  // Risk-based recommendations
  if (riskScore > 70) {
    insights.push(`❌ High risk token - whale movements could cause extreme price volatility`);
  } else if (riskScore > 40) {
    insights.push(`⚠️ Medium risk - monitor whale activity for potential price impacts`);
  } else {
    insights.push(`✅ Low whale risk - good token distribution for stable price action`);
  }
  
  return insights;
};

// Classify movement significance
export const classifyMovementSignificance = (amountUSD: number): WhaleMovement['significance'] => {
  if (amountUSD >= 1000000) return 'whale';    // $1M+
  if (amountUSD >= 100000) return 'large';     // $100K+
  if (amountUSD >= 10000) return 'medium';     // $10K+
  return 'small';                              // <$10K
};

// Determine movement type
export const determineMovementType = (from: string, to: string): WhaleMovement['movementType'] => {
  // Simple heuristics - can be enhanced with exchange address detection
  const exchanges = ['0x000000', '0x111111']; // Placeholder for known exchange addresses
  
  if (exchanges.some(addr => from.toLowerCase().includes(addr.toLowerCase()))) {
    return 'accumulation'; // From exchange to wallet
  }
  if (exchanges.some(addr => to.toLowerCase().includes(addr.toLowerCase()))) {
    return 'distribution'; // From wallet to exchange
  }
  return 'transfer'; // Wallet to wallet
};

// Format whale address for display
export const formatWhaleAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Calculate whale watching priority score
export const calculateWatchPriority = (whale: WhaleHolder): number => {
  let score = 0;
  
  // Base score from percentage holding
  score += whale.percentage * 10;
  
  // Whale type multiplier
  switch (whale.whaleType) {
    case 'mega': score *= 2; break;
    case 'large': score *= 1.5; break;
    case 'medium': score *= 1.2; break;
  }
  
  // Recent activity bonus
  if (whale.lastActivity) {
    const daysSinceActivity = (Date.now() - new Date(whale.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 7) score *= 1.5; // Active in last week
    else if (daysSinceActivity < 30) score *= 1.2; // Active in last month
  }
  
  return Math.round(score);
};