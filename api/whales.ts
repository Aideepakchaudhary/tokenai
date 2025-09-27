import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Token configurations with addresses
const TOKEN_CONFIGS: { [key: string]: { address: string; name: string; symbol: string; decimals: number } } = {
  'WETH': { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18 },
  'USDC': { address: '0xA0b86a33E6416c2120b0d69a9E1B42C0CAA5A4f3', name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD', symbol: 'USDT', decimals: 6 },
  'DAI': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  'LINK': { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', name: 'Chainlink', symbol: 'LINK', decimals: 18 },
  'UNI': { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap', symbol: 'UNI', decimals: 18 },
  'WBTC': { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped BTC', symbol: 'WBTC', decimals: 8 },
  'COMP': { address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', name: 'Compound', symbol: 'COMP', decimals: 18 },
  'AAVE': { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', name: 'Aave', symbol: 'AAVE', decimals: 18 },
  'MKR': { address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', name: 'Maker', symbol: 'MKR', decimals: 18 }
};

// GraphQL query for token holders
const TOKEN_HOLDERS_QUERY = `
  query GetTokenHolders($tokenAddress: String!, $first: Int!, $skip: Int!) {
    token(id: $tokenAddress) {
      id
      symbol
      name
      decimals
      totalSupply
    }
    tokenHolders: tokenBalances(
      where: { 
        token: $tokenAddress, 
        valueExact_gt: "0"
      }
      first: $first
      skip: $skip
      orderBy: valueExact
      orderDirection: desc
    ) {
      id
      account {
        id
      }
      token {
        id
        symbol
        name
        decimals
      }
      valueExact
      value
    }
  }
`;

// Utility functions
const formatTokenAmount = (amount: string, decimals: number): number => {
  try {
    return parseFloat(amount) / Math.pow(10, decimals);
  } catch {
    return 0;
  }
};

const formatLargeNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Filter out invalid holders
const isValidHolder = (holder: any): boolean => {
  if (!holder?.account?.id || !holder?.valueExact) return false;
  
  const address = holder.account.id;
  const amount = parseFloat(holder.valueExact);
  
  // Filter out zero or negative amounts
  if (amount <= 0) return false;
  
  // Filter out invalid addresses
  if (!isValidEthereumAddress(address)) return false;
  
  // Filter out known contract addresses (optional - you can expand this list)
  const knownContracts = [
    '0x0000000000000000000000000000000000000000', // Zero address
    '0x000000000000000000000000000000000000dead', // Burn address
  ];
  
  if (knownContracts.includes(address.toLowerCase())) return false;
  
  // Filter out unrealistic amounts (this might need adjustment per token)
  const formattedAmount = formatTokenAmount(holder.valueExact, holder.token?.decimals || 18);
  if (formattedAmount > 1e15) return false; // Unrealistically large amounts
  
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  try {
    const { token, address, limit = 10, offset = 0 } = req.query;
    const startTime = Date.now();

    // Validate inputs
    let tokenAddress = address as string;
    let tokenInfo = null;

    if (token && typeof token === 'string') {
      const upperToken = token.toUpperCase();
      if (TOKEN_CONFIGS[upperToken]) {
        tokenAddress = TOKEN_CONFIGS[upperToken].address;
        tokenInfo = TOKEN_CONFIGS[upperToken];
      } else {
        return res.status(400).json({
          success: false,
          data: null,
          timestamp: new Date().toISOString(),
          error: 'Unsupported token. Supported tokens: ' + Object.keys(TOKEN_CONFIGS).join(', ')
        });
      }
    }

    if (!tokenAddress) {
      return res.status(400).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Either token symbol or token address is required'
      });
    }

    if (!isValidEthereumAddress(tokenAddress)) {
      return res.status(400).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Invalid Ethereum address format'
      });
    }

    const limitNum = Math.min(parseInt(limit as string) || 10, 100); // Cap at 100
    const offsetNum = parseInt(offset as string) || 0;

    // Query The Graph
    const response = await axios.post('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
      query: TOKEN_HOLDERS_QUERY,
      variables: {
        tokenAddress: tokenAddress.toLowerCase(),
        first: Math.min(limitNum * 3, 300), // Get more to filter out invalid ones
        skip: offsetNum
      }
    }, {
      timeout: 30000 // 30 second timeout
    });

    if (!response.data?.data) {
      throw new Error('Invalid response from The Graph API');
    }

    const { token: tokenData, tokenHolders } = response.data.data;

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Token not found in The Graph API'
      });
    }

    // Filter valid holders and format data
    const validHolders = tokenHolders
      .filter(isValidHolder)
      .slice(0, limitNum) // Take only the requested amount after filtering
      .map((holder: any, index: number) => {
        const formattedAmount = formatTokenAmount(holder.valueExact, parseInt(tokenData.decimals));
        const percentage = tokenData.totalSupply ? 
          (parseFloat(holder.valueExact) / parseFloat(tokenData.totalSupply)) * 100 : 0;

        return {
          rank: offsetNum + index + 1,
          address: holder.account.id,
          balance: formattedAmount,
          balanceFormatted: formatLargeNumber(formattedAmount),
          balanceRaw: holder.valueExact,
          percentage: percentage,
          percentageFormatted: percentage > 0.01 ? `${percentage.toFixed(2)}%` : '<0.01%'
        };
      });

    // Calculate statistics
    const totalValidHolders = validHolders.length;
    const totalOriginalHolders = tokenHolders.length;
    const filteredOut = totalOriginalHolders - totalValidHolders;

    const responseData = {
      token: {
        address: tokenData.id,
        symbol: tokenData.symbol || tokenInfo?.symbol || 'UNKNOWN',
        name: tokenData.name || tokenInfo?.name || 'Unknown Token',
        decimals: parseInt(tokenData.decimals) || tokenInfo?.decimals || 18,
        totalSupply: tokenData.totalSupply,
        totalSupplyFormatted: tokenData.totalSupply ? 
          formatLargeNumber(formatTokenAmount(tokenData.totalSupply, parseInt(tokenData.decimals))) : 'Unknown'
      },
      holders: validHolders,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        returned: totalValidHolders,
        hasMore: totalValidHolders === limitNum // Assume more data if we got exactly what we asked for
      },
      statistics: {
        totalHoldersQueried: totalOriginalHolders,
        validHoldersReturned: totalValidHolders,
        filteredOut: filteredOut,
        filterRate: totalOriginalHolders > 0 ? `${((filteredOut / totalOriginalHolders) * 100).toFixed(1)}%` : '0%'
      }
    };

    return res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Whale API Error:', error);
    
    let errorMessage = 'Failed to fetch whale data';
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = 'Request timeout - The Graph API is taking too long to respond';
    } else if (error.response?.status >= 500) {
      errorMessage = 'The Graph API is currently unavailable';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limited by The Graph API - please try again later';
    } else if (error.message?.includes('Invalid response')) {
      errorMessage = 'Invalid response from The Graph API';
    }

    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}