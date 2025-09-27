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
    const tokenSymbol = firstHolder.symbol || 'Unknown';
    const tokenName = firstHolder.name || 'Unknown Token';
    const totalSupply = '0'; // We'll calculate from holders

    // Process holders into whale format with data validation
    console.log(`Raw holder data sample:`, JSON.stringify(holdersData[0], null, 2));
    
    // Data validation - filter out corrupted holders
    const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const decimals = parseInt(firstHolder.decimals || '18');
    
    const validHolders = holdersData.filter((holder: any) => {
      // Filter out max uint256 values (corrupted data)
      if (holder.amount === maxUint256) {
        console.log(`⚠️  Filtering out holder ${holder.address} with max uint256 value`);
        return false;
      }
      
      // Filter out holders with unrealistic USD values (>$100 billion)
      if (holder.value && holder.value > 100_000_000_000) {
        console.log(`⚠️  Filtering out holder ${holder.address} with unrealistic value: $${holder.value}`);
        return false;
      }
      
      // Filter out zero amounts
      if (parseFloat(holder.amount || '0') === 0) {
        return false;
      }
      
      return true;
    });
    
    // For percentage calculation, we'll calculate relative to the sum of all holders returned
    // rather than trying to get absolute token supply

    console.log(`Filtered ${holdersData.length} holders down to ${validHolders.length} valid holders`);
    
    if (validHolders.length === 0) {
      console.log('All holders have max uint256 values - trying different token or The Graph API has data quality issues');
      // Return empty analysis instead of mock data
      return res.json({
        success: true,
        data: {
          tokenAddress,
          tokenSymbol,
          tokenName,
          totalSupply,
          whaleCount: 0,
          whaleConcentration: 0,
          riskScore: 0,
          distributionHealth: 'healthy' as const,
          topWhales: [],
          recentMovements: [],
          insights: ['No valid whale data available - token may have data quality issues or unusual distribution']
        },
        timestamp: new Date().toISOString(),
        requestDuration: Date.now() - startTime
      });
    }

    // Calculate total supply from valid holders for percentage calculation
    // Convert from wei/smallest unit to actual token amounts using decimals
    const totalValidSupply = validHolders.reduce((sum: number, holder: any) => {
      const rawAmount = parseFloat(holder.amount || '0');
      const actualAmount = rawAmount / Math.pow(10, decimals);
      return sum + actualAmount;
    }, 0);

    console.log(`Total valid supply: ${totalValidSupply.toLocaleString()} ${tokenSymbol}`);

    const whales: WhaleHolder[] = validHolders.map((holder: any) => {
      const rawBalance = parseFloat(holder.amount || '0');
      const actualBalance = rawBalance / Math.pow(10, decimals);
      const percentage = totalValidSupply > 0 ? (actualBalance / totalValidSupply) * 100 : 0;
      
      // Calculate realistic USD value - cap at reasonable amounts
      let balanceUSD = parseFloat(holder.value || '0');
      if (balanceUSD > 100_000_000_000) { // If > $100B, likely corrupted
        balanceUSD = 0; // Set to 0 rather than showing unrealistic values
      }
      
      const whale: WhaleHolder = {
        address: holder.address,
        balance: actualBalance.toFixed(2),
        balanceUSD,
        percentage: parseFloat(percentage.toFixed(2)),
        whaleType: classifyWhale(percentage),
        lastActivity: holder.last_balance_update
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

// GET /api/whale/movements/:tokenAddress - Analyze whale activity patterns
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
    // Since /transfers endpoint doesn't exist, we'll analyze holder activity patterns
    // by looking at recent holder updates from the holders endpoint
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
    
    // Analyze recent whale activity by checking last_balance_update times
    const recentActivity = holdersData
      .filter((holder: any) => {
        // Only include significant holders (> 0.1% or high value)
        const value = parseFloat(holder.value || '0');
        return value > 10000 && holder.last_balance_update; // $10K+ value
      })
      .map((holder: any) => ({
        address: holder.address,
        lastActivity: holder.last_balance_update,
        value: parseFloat(holder.value || '0'),
        balanceChange: 'stable', // We don't have historical data to calculate actual changes
        activityType: 'holder_update'
      }))
      .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    return res.json({
      success: true,
      data: {
        tokenAddress,
        recentActivity,
        totalActiveWhales: recentActivity.length,
        analysisNote: 'Activity analysis based on holder balance updates. Real-time transfer tracking requires different data sources.'
      },
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Whale Activity API Error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: error.response?.data?.message || 'Failed to fetch whale activity data'
    });
  }
});

export default whaleRouter;