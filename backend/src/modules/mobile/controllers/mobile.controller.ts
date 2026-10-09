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

export const getAvailableRangers = async (_req: Request, res: Response) => {
  try {
    const { User } = await import('../../../models/User.model.js');
    const rangers = await User.find({ role: 'Ranger' }).select('name email role assignedPark');
    
    // Format rangers for mobile app
    const formattedRangers = rangers.map(ranger => ({
      _id: ranger._id,
      name: ranger.name,
      park: ranger.assignedPark || 'Unknown Park',
      specialty: 'Rapid Intervention Scout', // placeholder since there's no specialty in model
      distance: Math.floor(Math.random() * 10) + 1 + 'km', // mock distance
      eta: Math.floor(Math.random() * 15) + 5 + ' mins', // mock ETA
      status: 'AVAILABLE'
    }));

    res.status(200).json({
      success: true,
      data: formattedRangers
    });
  } catch (error) {
    console.error('Error fetching available rangers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
