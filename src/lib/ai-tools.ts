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
            totalValue: `$${data.totalValueUSD.toLocaleString()}`,
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
            value: `$${token.value.toLocaleString()}`,
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

// Query Intent Detection
export const detectIntent = (query: string): { intent: string; address?: string } => {
  const lowerQuery = query.toLowerCase();
  
  // Extract address if present
  const address = extractAddressFromQuery(query);
  
  // Portfolio-related queries
  if (lowerQuery.includes('portfolio') || 
      lowerQuery.includes('my wallet') ||
      lowerQuery.includes('what do i own') ||
      lowerQuery.includes('my tokens') ||
      lowerQuery.includes('analyze') && address) {
    return { intent: 'portfolio_analysis', address };
  }
  
  // Whale-related queries
  if (lowerQuery.includes('whale') || 
      lowerQuery.includes('biggest holder') ||
      lowerQuery.includes('top holder')) {
    return { intent: 'whale_analysis' };
  }
  
  // Default
  return { intent: 'unknown' };
};