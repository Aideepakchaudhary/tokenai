import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicTool } from "@langchain/core/tools";
import axios from 'axios';

// Inline utility functions
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

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

// Create portfolio analysis tool
const createPortfolioAnalysisTool = (baseUrl: string, chain: string = 'ethereum') => {
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

        // Call portfolio API
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
          topTokens: data.tokens.slice(0, 5).map((token: any) => ({
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

// Create balance tool
const createBalanceTool = (baseUrl: string, chain: string = 'ethereum') => {
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

        // Call portfolio API
        const response = await axios.get(`${baseUrl}/api/portfolio?wallet=${encodeURIComponent(walletAddress.trim())}&chain=${chain}`);
        
        if (!response.data.success) {
          return JSON.stringify({
            error: response.data.error || "Failed to fetch balance data"
          });
        }

        const data = response.data.data;
        
        // Format response for balance query - simpler than full analysis
        return JSON.stringify({
          success: true,
          summary: `Balance for ${data.walletAddress}`,
          totalValue: formatUSD(data.totalValueUSD),
          tokenCount: data.tokenCount,
          topTokens: data.tokens.slice(0, 3).map((token: any) => ({
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

// Create whale analysis placeholder
const createWhaleAnalysisTool = () => {
  return new DynamicTool({
    name: "whale_analysis",
    description: "Whale analysis feature (placeholder)",
    func: async (query: string) => {
      return JSON.stringify({
        message: "Whale analysis feature is under development. For now, try portfolio analysis with a wallet address!",
        availableFeatures: ["Portfolio Analysis", "Token Holdings", "Balance Check"]
      });
    }
  });
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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  try {
    const { message, chain = 'ethereum' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: 'Message is required'
      });
    }

    const startTime = Date.now();

    // Initialize OpenAI
    const llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create tools - use the request host for the base URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const tools = [
      createBalanceTool(baseUrl, chain),
      createPortfolioAnalysisTool(baseUrl, chain),
      createWhaleAnalysisTool()
    ];

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are ChainMate, an AI-powered crypto portfolio analyst. You help users analyze their crypto wallets and token holdings.

Your capabilities:
- Balance Check: Get wallet balance and basic token information
- Portfolio Analysis: Detailed analysis with diversity scores, insights, and recommendations
- Whale Analysis: Track large token holders (coming soon)

Guidelines:
1. Always be helpful and accurate with crypto data
2. Choose the right tool based on user intent:
   - Use "balance_check" for simple balance/value queries ("balance", "how much", "total value")
   - Use "portfolio_analysis" for detailed analysis ("analyze", "insights", "diversity", "breakdown")
3. Explain complex crypto concepts in simple terms
4. Provide actionable insights and recommendations when doing analysis
5. If you need a wallet address, ask the user to provide one
6. Format responses clearly and concisely

Current working features: Balance Check, Portfolio Analysis
Coming soon: Whale tracking, Token discovery, Multi-chain analysis`
      ],
      [
        "human",
        "{input}"
      ],
      [
        "placeholder",
        "{agent_scratchpad}"
      ]
    ]);

    // Create agent
    const agent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: false,
    });

    // Execute the agent
    const response = await agentExecutor.invoke({
      input: message,
    });

    // Create response message
    const responseMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant' as const,
      content: response.output,
      timestamp: new Date().toISOString(),
      data: response.intermediateSteps?.length > 0 ? {
        toolCalls: response.intermediateSteps.map((step: any) => ({
          tool: step.action?.tool || 'unknown',
          input: step.action?.toolInput || '',
          output: step.observation || ''
        }))
      } : undefined
    };

    return res.json({
      success: true,
      data: responseMessage,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to process your message';
    
    if (error.message?.includes('API key')) {
      errorMessage = 'OpenAI API configuration error - please check API key';
    } else if (error.message?.includes('quota') || error.message?.includes('billing')) {
      errorMessage = 'OpenAI API quota exceeded - please check your billing';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    }
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: errorMessage
    });
  }
}