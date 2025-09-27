// Format large numbers
export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

// Format currency
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Format wallet address
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Calculate portfolio diversity score
export function calculateDiversityScore(tokens: Array<{ value: number }>): number {
  if (tokens.length === 0) return 0;
  
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  const weights = tokens.map(token => token.value / totalValue);
  
  // Shannon diversity index normalized to 0-100
  const entropy = -weights.reduce((sum, weight) => {
    return weight > 0 ? sum + weight * Math.log(weight) : sum;
  }, 0);
  
  const maxEntropy = Math.log(tokens.length);
  return maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;
}

// Determine portfolio health based on diversity
export function getPortfolioHealth(diversityScore: number): 'concentrated' | 'moderate' | 'diversified' {
  if (diversityScore < 30) return 'concentrated';
  if (diversityScore < 70) return 'moderate';
  return 'diversified';
}

// Generate AI insights based on portfolio data
export function generatePortfolioInsights(data: {
  diversityScore: number;
  tokenCount: number;
  topHolding: { percentage: string };
}): string[] {
  const insights: string[] = [];
  
  if (data.diversityScore < 30) {
    insights.push("Portfolio is highly concentrated - consider diversifying to reduce risk");
  } else if (data.diversityScore > 80) {
    insights.push("Well-diversified portfolio with good risk distribution");
  }
  
  if (data.tokenCount < 5) {
    insights.push("Portfolio has few tokens - may benefit from additional positions");
  } else if (data.tokenCount > 20) {
    insights.push("Large number of positions - consider consolidating smaller holdings");
  }
  
  const topPercentage = parseFloat(data.topHolding.percentage);
  if (topPercentage > 50) {
    insights.push("Top holding dominates portfolio - high concentration risk");
  }
  
  return insights;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}