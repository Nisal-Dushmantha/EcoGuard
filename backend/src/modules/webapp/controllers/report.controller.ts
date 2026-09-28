import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { AuthenticatedRequest } from '../../../middlewares/auth.middleware.js';

/**
 * @route   GET /api/webapp/parks
 * @desc    Get list of registered national parks and their geographic sectors
 */
export const getParks = (_req: Request, res: Response): void => {
  try {
    const parks = ReportService.getParks();
    res.status(200).json({
      success: true,
      parks,
    });
  } catch (error: any) {
    console.error('Error fetching parks:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch parks.' });
  }
};

/**
 * @route   GET /api/webapp/analytics/summary
 * @desc    Get derived dashboard metrics for Park Manager
 */
export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const park = (req.query.park as string) || undefined;
    const summary = await ReportService.getAnalyticsSummary(park);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      error: error?.message || 'Failed to retrieve analytics summary from database.',
    });
  }
};

/**
 * @route   POST /api/webapp/reports/generate
 * @desc    UC04: Generate a conservation report based on criteria
 */
export const generateReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { park, startDate, endDate, location, sections } = req.body;

    const user = {
      id: req.user?.id || 'mgr-01',
      name: req.user?.name || 'Park Manager',
      role: req.user?.role || 'Park Manager',
    };

    const result = await ReportService.generateReport(
      {
        park,
        startDate,
        endDate,
        location,
        sections,
      },
      user
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Report generation error:', error?.message);
    // Client validation errors get 400
    if (
      error.message.includes('Invalid date range') ||
      error.message.includes('Please select at least one') ||
      error.message.includes('required') ||
      error.message.includes('valid')
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error?.message || 'Unable to retrieve conservation data. Please try again.',
    });
  }
};

/**
 * @route   GET /api/webapp/reports
 * @desc    Retrieve historical generated reports
 */
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const park = (req.query.park as string) || undefined;
    const reports = await ReportService.getReports(park);
    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch reports.' });
  }
};

/**
 * @route   GET /api/webapp/reports/:id
 * @desc    Get report details by reportId
 */
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const report = await ReportService.getReportById(id);

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Error fetching report by ID:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch report.' });
  }
};
