import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔍 [Health] Health check requested');
  
  // Set CORS headers for Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const healthData = {
    status: 'healthy',
    service: 'datapizza-vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  console.log('✅ [Health] Returning healthy status');
  res.status(200).json(healthData);
}