import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { isValidAddress } from "./backend-utils";

// Portfolio Analysis Tool
export const createPortfolioAnalysisTool = (baseUrl: string) => {
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

        // Call our portfolio API
        const response = await axios.get(`${baseUrl}/api/portfolio?wallet=${encodeURIComponent(walletAddress.trim())}`);
        
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
            totalValue: `$${data.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
            value: `$${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            balance: (parseFloat(token.amount) / Math.pow(10, token.decimals)).toFixed(4)
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

// Whale Analysis Tool (placeholder for future implementation)
export const createWhaleAnalysisTool = (baseUrl: string) => {
  return new DynamicTool({
    name: "whale_analysis",
    description: `Analyze whale holders of a specific token. Use this when users ask about:
    - "Who are the biggest holders of [TOKEN]?"
    - "Show me [TOKEN] whales"
    - "Whale analysis for [TOKEN]"
    
    Currently returns a placeholder response - full implementation coming soon.`,
    
    func: async (query: string) => {
      return JSON.stringify({
        message: "Whale analysis feature is coming soon! For now, I can analyze wallet portfolios. Try asking: 'Analyze my portfolio 0x...'",
        availableFeatures: ["Portfolio Analysis", "Token Holdings", "Diversity Scoring"]
      });
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
export const createBalanceTool = (baseUrl: string) => {
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

        // Call our portfolio API
        const response = await axios.get(`${baseUrl}/api/portfolio?wallet=${encodeURIComponent(walletAddress.trim())}`);
        
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
          totalValue: `$${data.totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          tokenCount: data.tokenCount,
          topTokens: data.tokens.slice(0, 3).map(token => ({
            symbol: token.symbol,
            value: `$${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
