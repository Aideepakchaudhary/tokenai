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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Enhanced portfolio health calculation with concentration override
export function getPortfolioHealthEnhanced(diversityScore: number, topHoldingPercentage: number): 'concentrated' | 'moderate' | 'diversified' {
  // Override: If top holding is >60%, force concentrated regardless of diversity score
  if (topHoldingPercentage > 60) {
    return 'concentrated';
  }
  
  // Standard diversity-based classification
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
  
  const topPercentage = parseFloat(data.topHolding.percentage);
  
  // Concentration insights based on top holding percentage
  if (topPercentage > 80) {
    insights.push("Portfolio is extremely concentrated - consider diversifying to reduce risk");
  } else if (topPercentage > 60) {
    insights.push("Portfolio shows high concentration - consider adding other positions");
  } else if (data.diversityScore < 30) {
    insights.push("Portfolio is highly concentrated - consider diversifying to reduce risk");
  } else if (data.diversityScore > 80) {
    insights.push("Well-diversified portfolio with good risk distribution");
  }
  
  if (data.tokenCount < 5) {
    insights.push("Portfolio has few tokens - may benefit from additional positions");
  } else if (data.tokenCount > 20) {
    insights.push("Large number of positions - consider consolidating smaller holdings");
  }
  
  return insights;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}