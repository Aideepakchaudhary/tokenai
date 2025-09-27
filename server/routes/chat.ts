import express from 'express';
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createPortfolioAnalysisTool, createWhaleAnalysisTool, createBalanceTool } from '../../src/lib/ai-tools';
import { APIResponse, ChatMessage } from '../../src/lib/types';

export const chatRouter = express.Router();

chatRouter.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { message, conversationId, chain } = req.body;

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

    // Create tools with chain parameter
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const chainParam = chain || 'ethereum';
    const tools = [
      createBalanceTool(baseUrl, chainParam),
      createPortfolioAnalysisTool(baseUrl, chainParam),
      createWhaleAnalysisTool(baseUrl, chainParam)
    ];

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are ChainMate, an AI-powered crypto portfolio analyst. You help users analyze their crypto wallets and token holdings.

Your capabilities:
- Balance Check: Get wallet balance and basic token information
- Portfolio Analysis: Detailed analysis with diversity scores, insights, and recommendations  
- Whale Analysis: Analyze token holder distribution and whale activity

Guidelines:
1. Always be helpful and accurate with crypto data
2. Choose the right tool based on user intent:
   - Use "balance_check" for simple balance/value queries ("balance", "how much", "total value")
   - Use "portfolio_analysis" for detailed wallet analysis ("analyze wallet", "portfolio insights", "diversity")
   - Use "whale_analysis" for token holder analysis ("whale holders", "token distribution", "biggest holders")
3. Explain complex crypto concepts in simple terms
4. Provide actionable insights and recommendations when doing analysis
5. For whale analysis, you need a token contract address
6. For portfolio analysis, you need a wallet address
7. Format responses clearly and concisely with emojis for better readability

Current working features: Balance Check, Portfolio Analysis, Whale Analysis
Advanced features: Multi-chain analysis, Risk assessment, Distribution health scoring`
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
    const responseMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
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
    
    const startTime = Date.now();
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: errorMessage
    });
  }
});