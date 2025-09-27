import express from 'express';
import axios from 'axios';
import { APIResponse } from '../../src/lib/types';
import { 
  WhaleHolder, 
  WhaleAnalysis, 
  WhaleMovement,
  classifyWhale, 
  calculateWhaleRisk,
  calculateDistributionRisk, 
  getDistributionHealth, 
  generateWhaleInsights,
  classifyMovementSignificance,
  determineMovementType,
  calculateWatchPriority
} from '../../src/lib/whale-utils';

export const whaleRouter = express.Router();

// Types imported from whale-utils

// GET /api/whale/holders/:tokenAddress
whaleRouter.get('/holders/:tokenAddress', async (req: express.Request, res: express.Response) => {
  const { tokenAddress } = req.params;
  const { chain = 'ethereum', limit = '50' } = req.query;

  if (!tokenAddress || tokenAddress.length !== 42 || !tokenAddress.startsWith('0x')) {
    return res.status(400).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Invalid token address format'
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
  console.log(`Fetching whale data for token ${tokenAddress} on ${chain} (network_id: ${networkId})`);

  try {
    // Get token holders from The Graph API
    const response = await axios.get(
      `${process.env.TOKEN_API_BASE_URL}/holders/evm/${tokenAddress}?network_id=${networkId}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GRAPH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const holdersData = response.data.data || [];
    
    if (!holdersData || holdersData.length === 0) {
      return res.json({
        success: true,
        data: {
          tokenAddress,
          tokenSymbol: 'Unknown',
          tokenName: 'Unknown Token',
          totalSupply: '0',
          whaleCount: 0,
          whaleConcentration: 0,
          riskScore: 0,
          distributionHealth: 'healthy' as const,
          topWhales: [],
          recentMovements: [],
          insights: ['No whale data available for this token']
        },
        timestamp: new Date().toISOString(),
        requestDuration: Date.now() - startTime
      });
    }

    // Get token metadata from first holder
    const firstHolder = holdersData[0];
    const tokenSymbol = firstHolder.token_symbol || 'Unknown';
    const tokenName = firstHolder.token_name || 'Unknown Token';
    const totalSupply = firstHolder.total_supply || '0';

    // Process holders into whale format with enhanced analytics
    const whales: WhaleHolder[] = holdersData.map((holder: any) => {
      const percentage = parseFloat(holder.percentage || '0');
      const whale: WhaleHolder = {
        address: holder.holder_address,
        balance: holder.balance,
        balanceUSD: holder.balance_usd || 0,
        percentage,
        whaleType: classifyWhale(percentage),
        lastActivity: holder.last_transaction_date
      };
      whale.riskLevel = calculateWhaleRisk(whale);
      return whale;
    });

    // Sort by watch priority and filter significant holders
    const sortedWhales = whales.sort((a, b) => calculateWatchPriority(b) - calculateWatchPriority(a));
    const significantWhales = sortedWhales.filter(whale => whale.percentage >= 0.1);
    
    // Calculate enhanced metrics
    const whaleCount = significantWhales.length;
    const whaleConcentration = sortedWhales.slice(0, 10).reduce((sum, whale) => sum + whale.percentage, 0);
    const riskScore = calculateDistributionRisk(sortedWhales);
    const distributionHealth = getDistributionHealth(riskScore);

    // Create partial analysis for insights generation
    const partialAnalysis = {
      whaleCount,
      whaleConcentration,
      riskScore,
      topWhales: sortedWhales.slice(0, 20)
    };
    const insights = generateWhaleInsights(partialAnalysis);

    const whaleAnalysis: WhaleAnalysis = {
      tokenAddress,
      tokenSymbol,
      tokenName,
      totalSupply,
      whaleCount,
      whaleConcentration: Math.round(whaleConcentration * 100) / 100,
      riskScore,
      distributionHealth,
      topWhales: sortedWhales.slice(0, 20), // Top 20 holders by priority
      recentMovements: [], // Will be populated in next phase
      insights
    };

    return res.json({
      success: true,
      data: whaleAnalysis,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Whale Analysis API Error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: error.response?.data?.message || 'Failed to fetch whale data'
    });
  }
});

// GET /api/whale/movements/:tokenAddress - Recent whale movements
whaleRouter.get('/movements/:tokenAddress', async (req: express.Request, res: express.Response) => {
  const { tokenAddress } = req.params;
  const { chain = 'ethereum', limit = '20' } = req.query;

  const startTime = Date.now();
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
    // Get recent transfers for the token
    const response = await axios.get(
      `${process.env.TOKEN_API_BASE_URL}/transfers/evm/${tokenAddress}?network_id=${networkId}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GRAPH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transfersData = response.data.data || [];
    
    // Filter for significant movements (>$10K USD)
    const significantMovements = transfersData.filter((transfer: any) => {
      return transfer.value_usd && transfer.value_usd > 10000;
    });

    return res.json({
      success: true,
      data: {
        tokenAddress,
        movements: significantMovements,
        totalMovements: significantMovements.length
      },
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Whale Movements API Error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: error.response?.data?.message || 'Failed to fetch whale movements'
    });
  }
});

export default whaleRouter;