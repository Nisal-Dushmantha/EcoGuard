import { Request, Response } from 'express';
import { CommunityReport } from '../../../models/CommunityReport.model.js';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const park = req.query.park as string;
    const filter: any = {};
    if (park) {
      filter.park = park;
    }

    // 1. Get counts
    const pendingCount = await CommunityReport.countDocuments({ ...filter, status: 'Pending Verification' });
    // Assuming 'Resolved' maps to 'Verified' based on schema, or we can use a logical mapping
    const verifiedCount = await CommunityReport.countDocuments({ ...filter, status: 'Resolved' });
    const dispatchedCount = await CommunityReport.countDocuments({ ...filter, status: 'Dispatched' });

    // 2. Get Needs Attention reports
    // Prioritize High/Critical severity and oldest unresolved
    const needsAttention = await CommunityReport.find({
      ...filter,
      status: { $in: ['Pending Verification', 'Dispatched'] }
    })
      .sort({
        severity: -1, // Note: sort by severity might need custom sorting if it's string, but for now we sort by reportedAt
        reportedAt: 1 // Oldest first
      })
      .limit(10)
      .lean();

    // Fix sorting since severity is a String Enum ('Low', 'Medium', 'High', 'Critical')
    // We sort it in memory for the top 10 to ensure Critical/High are first
    const severityWeight: Record<string, number> = {
      'Critical': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    needsAttention.sort((a, b) => {
      const weightA = severityWeight[a.severity] || 0;
      const weightB = severityWeight[b.severity] || 0;
      if (weightA !== weightB) {
        return weightB - weightA; // Higher severity first
      }
      // If same severity, oldest first
      return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
    });

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        verified: verifiedCount,
        dispatched: dispatchedCount,
        needsAttention: needsAttention.slice(0, 5), // Return top 5 for dashboard
      }
    });
  } catch (err: any) {
    console.error('Error in getDashboardSummary:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
