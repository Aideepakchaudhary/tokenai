import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

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

  const { tokenAddress, chain = 'ethereum', limit = '50' } = req.query;

  if (!tokenAddress || typeof tokenAddress !== 'string' || tokenAddress.length !== 42 || !tokenAddress.startsWith('0x')) {
    return res.status(400).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Invalid token address format. Provide tokenAddress query parameter.'
    });
  }

  const startTime = Date.now();

  try {
    // Mock whale data for testing
    const whaleAnalysis = {
      tokenAddress,
      tokenSymbol: 'COMP',
      tokenName: 'Compound',
      totalSupply: '10000000',
      whaleCount: 25,
      whaleConcentration: 45.5,
      riskScore: 60,
      distributionHealth: 'concerning' as const,
      topWhales: [
        {
          address: '0x2775b1c75658Be0F640272CCb8c72ac986009e38',
          balance: '500000.00',
          balanceUSD: 25000000,
          percentage: 5.0,
          whaleType: 'mega' as const,
          riskLevel: 'medium' as const,
          lastActivity: '2025-09-27'
        }
      ],
      recentMovements: [],
      insights: [
        'Found 25 significant whale holders for COMP',
        'Top 10 holders control 45.5% of total supply',
        'Distribution shows concerning concentration levels'
      ]
    };

    return res.json({
      success: true,
      data: whaleAnalysis,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Whale Analysis API Error:', error.message);
    
    return res.status(500).json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      error: 'Failed to fetch whale data'
    });
  }
}