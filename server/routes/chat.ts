import express from 'express';
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createPortfolioAnalysisTool, createWhaleAnalysisTool } from '../../src/lib/ai-tools';
import { APIResponse, ChatMessage } from '../../src/lib/types';

export const chatRouter = express.Router();

chatRouter.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { message, conversationId } = req.body;

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

    // Create tools
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const tools = [
      createPortfolioAnalysisTool(baseUrl),
      createWhaleAnalysisTool(baseUrl)
    ];

    // Create prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are ChainMate, an AI-powered crypto portfolio analyst. You help users analyze their crypto wallets and token holdings.

Your capabilities:
- Portfolio Analysis: Analyze wallet holdings, calculate diversity scores, provide insights
- Token Research: Information about specific tokens (coming soon)  
- Whale Analysis: Track large token holders (coming soon)

Guidelines:
1. Always be helpful and accurate with crypto data
2. If a user mentions a wallet address, use the portfolio_analysis tool
3. Explain complex crypto concepts in simple terms
4. Provide actionable insights and recommendations
5. If you need a wallet address, ask the user to provide one
6. Format responses clearly with bullet points and sections when appropriate

Current working features: Portfolio Analysis
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