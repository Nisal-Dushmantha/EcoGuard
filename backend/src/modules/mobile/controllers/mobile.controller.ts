import { Request, Response } from 'express';

/**
 * Controller for Mobile Application endpoints
 */
export const getMobileStatus = (_req: Request, res: Response) => {
  res.status(200).json({
    module: 'mobile',
    message: 'EcoGuard Mobile API is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

export const getMobileFeed = (_req: Request, res: Response) => {
  // Sample data placeholder for mobile app feed
  res.status(200).json({
    module: 'mobile',
    feed: [],
    message: 'Mobile feed endpoint ready for mobile app integration',
  });
};
