import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Import utility functions (we'll need to inline these or create shared utils)
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const calculateDiversityScore = (tokens: any[]): number => {
  if (tokens.length <= 1) return 0;
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  if (totalValue === 0) return 0;
  
  const entropy = tokens.reduce((entropy, token) => {
    const proportion = token.value / totalValue;
    return proportion > 0 ? entropy - (proportion * Math.log2(proportion)) : entropy;
  }, 0);
  
  const maxEntropy = Math.log2(tokens.length);
  return Math.round((entropy / maxEntropy) * 100);
};

const getPortfolioHealthEnhanced = (diversityScore: number, topPercentage: number): 'concentrated' | 'moderate' | 'diversified' => {
  // Override with top holding threshold
  if (topPercentage > 60) return 'concentrated';
  
  if (diversityScore >= 70) return 'diversified';
  if (diversityScore >= 40) return 'moderate';
  return 'concentrated';
};

const generatePortfolioInsights = (analysis: any): string[] => {
  const insights: string[] = [];
  const { diversityScore, tokenCount, topHolding } = analysis;
  
  // Concentration insights
  const topPercent = parseFloat(topHolding.percentage.replace('%', ''));
  if (topPercent > 60) {
    insights.push('Portfolio is extremely concentrated - consider diversifying to reduce risk');
  } else if (topPercent > 40) {
    insights.push('Portfolio shows high concentration - may benefit from additional positions');
  } else {
    insights.push('Portfolio shows good diversification across holdings');
  }
  
  // Token count insights
  if (tokenCount > 10) {
    insights.push('Well-diversified portfolio with multiple positions');
  } else if (tokenCount > 5) {
    insights.push('Moderate diversification - consider adding more positions');
  } else {
    insights.push('Portfolio has few tokens - may benefit from additional positions');
  }
  
  return insights;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  const { wallet, chain = 'ethereum' } = req.query;

  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Wallet address is required'
    });
  }

  if (!isValidAddress(wallet)) {
    return res.status(400).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Invalid wallet address format'
    });
  }

  const startTime = Date.now();

  // Map chain names to The Graph API network IDs
  const chainMapping: Record<string, string> = {
    'ethereum': 'mainnet',
    'arbitrum': 'arbitrum-one',
    'polygon': 'matic',
    'optimism': 'optimism',
    'base': 'base',
    'bsc': 'bsc'
  };

  const networkId = chainMapping[chain as string] || 'mainnet';

  try {
    // Call The Graph Token API
    const response = await axios.get(
      `${process.env.TOKEN_API_BASE_URL || 'https://token-api.thegraph.com'}/balances/evm/${wallet}?network_id=${networkId}&limit=200`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GRAPH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawTokens = response.data.data || [];

    // Data validation - filter corrupted tokens
    const tokens = rawTokens.filter((token: any) => {
      // Filter out tokens with unrealistic values (> $10 billion)
      if (token.value > 10_000_000_000) {
        console.log(`⚠️ Filtering out ${token.symbol} with unrealistic value: $${token.value}`);
        return false;
      }
      
      // Filter out tokens with negative values
      if (token.value < 0) {
        console.log(`⚠️ Filtering out ${token.symbol} with negative value: $${token.value}`);
        return false;
      }
      
      // Filter out tokens with zero values
      if (token.value === 0 && parseFloat(token.amount) === 0) {
        return false;
      }
      
      return true;
    });

    if (!tokens || tokens.length === 0) {
      return res.json({
        success: true,
        data: {
          walletAddress: wallet,
          totalValueUSD: 0,
          tokenCount: 0,
          topHolding: {
            symbol: 'N/A',
            name: 'No tokens found',
            valueUSD: 0,
            percentage: '0%'
          },
          diversityScore: 0,
          portfolioHealth: 'concentrated' as const,
          sectorBreakdown: {},
          lastActivity: 'Unknown',
          tokens: [],
          aiInsights: ['This wallet has no token holdings or is not on supported networks']
        },
        timestamp: new Date().toISOString(),
        requestDuration: Date.now() - startTime
      });
    }

    // Calculate portfolio metrics
    const totalValueUSD = tokens.reduce((sum: number, token: any) => sum + token.value, 0);
    const tokenCount = tokens.length;
    
    // Find top holding
    const sortedTokens = tokens.sort((a: any, b: any) => b.value - a.value);
    const topToken = sortedTokens[0];
    const topPercentage = parseFloat(((topToken.value / totalValueUSD) * 100).toFixed(1));
    
    // Calculate diversity score and health
    const diversityScore = calculateDiversityScore(tokens);
    const portfolioHealth = getPortfolioHealthEnhanced(diversityScore, topPercentage);

    // Generate insights
    const aiInsights = generatePortfolioInsights({
      diversityScore,
      tokenCount,
      topHolding: { percentage: `${topPercentage}%` }
    });

    // Add value-based insights
    if (totalValueUSD > 1000000) {
      aiInsights.unshift('High-value portfolio detected - consider advanced risk management strategies');
    } else if (totalValueUSD < 1000) {
      aiInsights.push('Small portfolio size - focus on building core positions first');
    }

    const portfolioAnalysis = {
      walletAddress: wallet,
      totalValueUSD,
      tokenCount,
      topHolding: {
        symbol: topToken.symbol,
        name: topToken.name,
        valueUSD: topToken.value,
        percentage: `${topPercentage}%`
      },
      diversityScore,
      portfolioHealth,
      sectorBreakdown: {
        'Other': { valueUSD: totalValueUSD, percentage: '100%' }
      },
      lastActivity: sortedTokens[0]?.last_balance_update || new Date().toISOString(),
      tokens: sortedTokens,
      aiInsights
    };

    return res.json({
      success: true,
      data: portfolioAnalysis,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Portfolio API Error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: error.response?.data?.message || 'Failed to fetch portfolio data'
    });
  }
}