import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { isValidAddress } from "./backend-utils";

// Smart decimal formatting for USD values
const formatUSD = (value: number): string => {
  if (value >= 1) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (value >= 0.01) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else if (value > 0) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })}`;
  } else {
    return '$0.00';
  }
};

// Portfolio Analysis Tool
export const createPortfolioAnalysisTool = (baseUrl: string, chain: string = 'ethereum') => {
  return new DynamicTool({
    name: "portfolio_analysis",
    description: `Analyze a crypto wallet's portfolio including token holdings, total value, diversity score, and AI insights. 
    Use this when users ask about:
    - "Show me my portfolio"
    - "What tokens do I own?"
    - "What's my portfolio worth?"
    - "Analyze this wallet: 0x..."
    - "How diversified is my crypto?"
    
    Input should be a valid Ethereum wallet address (0x followed by 40 hex characters).`,
    
    func: async (walletAddress: string) => {
      try {
        // Validate wallet address
        if (!isValidAddress(walletAddress.trim())) {
          return JSON.stringify({
            error: "Invalid wallet address format. Please provide a valid Ethereum address (0x followed by 40 hex characters).",
            example: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          });
        }

        // Call our portfolio API with chain parameter
        const response = await axios.get(`${baseUrl}/api/portfolio?wallet=${encodeURIComponent(walletAddress.trim())}&chain=${chain}`);
        
        if (!response.data.success) {
          return JSON.stringify({
            error: response.data.error || "Failed to fetch portfolio data"
          });
        }

        const data = response.data.data;
        
        // Format response for the AI
        return JSON.stringify({
          success: true,
          summary: `Portfolio Analysis for ${data.walletAddress}`,
          metrics: {
            totalValue: formatUSD(data.totalValueUSD),
            tokenCount: data.tokenCount,
            diversityScore: `${data.diversityScore}/100`,
            portfolioHealth: data.portfolioHealth,
            topHolding: `${data.topHolding.symbol} (${data.topHolding.percentage})`
          },
          insights: data.aiInsights,
          sectorBreakdown: data.sectorBreakdown,
          topTokens: data.tokens.slice(0, 5).map(token => ({
            symbol: token.symbol,
            name: token.name,
            value: formatUSD(token.value),
            balance: (parseFloat(token.amount) / Math.pow(10, token.decimals)).toFixed(8)
          })),
          lastActivity: data.lastActivity
        });

      } catch (error: any) {
        return JSON.stringify({
          error: error.response?.data?.error || error.message || "Failed to analyze portfolio"
        });
      }
    }
  });
};

// Whale Analysis Tool
export const createWhaleAnalysisTool = (baseUrl: string, chain: string = 'ethereum') => {
  return new DynamicTool({
    name: "whale_analysis",
    description: `Analyze whale holders and distribution of a specific token. Use this when users ask about:
    - "Who are the biggest holders of [TOKEN]?"
    - "Show me [TOKEN] whales"  
    - "Whale analysis for [TOKEN]"
    - "Is [TOKEN] whale dominated?"
    - "Token distribution analysis for [TOKEN]"
    
    Input should be a token contract address (0x followed by 40 hex characters).`,
    
    func: async (tokenInput: string) => {
      try {
        // Handle both token symbols and addresses
        let tokenAddress = tokenInput.trim();
        
        // Token symbol mapping for common tokens
        const tokenMapping: Record<string, string> = {
          'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
          'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
          'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
        };
        
        // If input is a symbol, convert to address
        if (!tokenAddress.startsWith('0x')) {
          const upperToken = tokenAddress.toUpperCase();
          tokenAddress = tokenMapping[upperToken] || tokenAddress;
        }
        
        // Validate token address
        const addressRegex = /0x[a-fA-F0-9]{40}/g;
        const cleanAddress = tokenAddress.match(addressRegex)?.[0];
        
        if (!cleanAddress) {
          return JSON.stringify({
            error: `Invalid token identifier: ${tokenInput}. Please provide a token symbol (UNI, USDC, etc.) or valid contract address (0x...)`,
            supportedSymbols: Object.keys(tokenMapping)
          });
        }

        // Call whale analysis API
        const response = await axios.get(`${baseUrl}/api/whale/holders/${cleanAddress}?chain=${chain}&limit=50`);
        
        if (!response.data.success) {
          return JSON.stringify({
            error: response.data.error || "Failed to fetch whale data"
          });
        }

        const data = response.data.data;
        
        // Format response for AI
        return JSON.stringify({
          success: true,
          summary: `Whale Analysis for ${data.tokenSymbol} (${data.tokenName})`,
          distribution: {
            whaleCount: data.whaleCount,
            concentration: `${data.whaleConcentration}% held by top 10`,
            riskScore: `${data.riskScore}/100`,
            health: data.distributionHealth
          },
          insights: data.insights,
          topWhales: data.topWhales.slice(0, 5).map((whale: any) => ({
            address: `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`,
            percentage: `${whale.percentage.toFixed(2)}%`,
            type: whale.whaleType,
            riskLevel: whale.riskLevel,
            valueUSD: formatUSD(whale.balanceUSD)
          })),
          riskAssessment: {
            overall: data.distributionHealth,
            score: data.riskScore,
            recommendation: data.riskScore > 70 ? "High risk - monitor whale activity" : 
                          data.riskScore > 40 ? "Medium risk - normal whale monitoring" : 
                          "Low risk - healthy distribution"
          }
        });

      } catch (error: any) {
        return JSON.stringify({
          error: error.response?.data?.error || error.message || "Failed to analyze whale holders"
        });
      }
    }
  });
};

// Address Extraction Helper
export const extractAddressFromQuery = (query: string): string | null => {
  // Look for Ethereum addresses (0x followed by 40 hex characters)
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  const matches = query.match(addressRegex);
  return matches ? matches[0] : null;
};

// Balance Tool for simple balance queries
export const createBalanceTool = (baseUrl: string, chain: string = 'ethereum') => {
  return new DynamicTool({
    name: "balance_check",
    description: `Get the balance and basic information for a crypto wallet. Use this when users ask about:
    - "Give me the balance of this account"
    - "What's the balance of 0x..."
    - "Show me the balance"
    - "How much does this wallet have?"
    - "What's the total value of 0x..."
    
    Input should be a valid Ethereum wallet address (0x followed by 40 hex characters).`,
    
    func: async (walletAddress: string) => {
      try {
        // Validate wallet address
        if (!isValidAddress(walletAddress.trim())) {
          return JSON.stringify({
            error: "Invalid wallet address format. Please provide a valid Ethereum address (0x followed by 40 hex characters).",
            example: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          });
        }

        // Call our portfolio API with chain parameter
        const response = await axios.get(`${baseUrl}/api/portfolio?wallet=${encodeURIComponent(walletAddress.trim())}&chain=${chain}`);
        
        if (!response.data.success) {
          return JSON.stringify({
            error: response.data.error || "Failed to fetch balance data"
          });
        }

        const data = response.data.data;
        
        // Format response for balance query - much simpler than full analysis
        return JSON.stringify({
          success: true,
          summary: `Balance for ${data.walletAddress}`,
          totalValue: formatUSD(data.totalValueUSD),
          tokenCount: data.tokenCount,
          topTokens: data.tokens.slice(0, 3).map(token => ({
            symbol: token.symbol,
            value: formatUSD(token.value)
          })),
          lastActivity: data.lastActivity
        });

      } catch (error: any) {
        return JSON.stringify({
          error: error.response?.data?.error || error.message || "Failed to get balance"
        });
      }
    }
  });
};

// Query Intent Detection
export const detectIntent = (query: string): { intent: string; address?: string } => {
  const lowerQuery = query.toLowerCase();
  
  // Extract address if present
  const address = extractAddressFromQuery(query);
  
  // Balance-related queries (simple)
  if (lowerQuery.includes('balance') || 
      lowerQuery.includes('total value') ||
      lowerQuery.includes('how much') ||
      lowerQuery.includes('what does') && lowerQuery.includes('have')) {
    return { intent: 'balance_check', address };
  }
  
  // Portfolio-related queries (detailed analysis)
  if (lowerQuery.includes('portfolio') || 
      lowerQuery.includes('analyze') ||
      lowerQuery.includes('diversity') ||
      lowerQuery.includes('insights') ||
      lowerQuery.includes('breakdown')) {
    return { intent: 'portfolio_analysis', address };
  }
  
  // Whale-related queries
  if (lowerQuery.includes('whale') || 
      lowerQuery.includes('biggest holder') ||
      lowerQuery.includes('top holder')) {
    return { intent: 'whale_analysis' };
  }
  
  // Default to balance for simple queries with address
  if (address && !lowerQuery.includes('analyze')) {
    return { intent: 'balance_check', address };
  }
  
  // Default
  return { intent: 'unknown' };
};
