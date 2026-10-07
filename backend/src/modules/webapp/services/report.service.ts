import mongoose from 'mongoose';
import { Incident, IIncident } from '../../../models/Incident.model.js';
import { Patrol, IPatrol } from '../../../models/Patrol.model.js';
import { CommunityReport, ICommunityReport } from '../../../models/CommunityReport.model.js';
import { ConservationReport, IConservationReport, ReportSection } from '../../../models/ConservationReport.model.js';
import { PARKS_CONFIG, ParkConfig } from '../../../config/parks.config.js';

export interface GenerateReportDTO {
  park: string;
  startDate: string;
  endDate: string;
  location?: string;
  sections: ReportSection[];
}

export interface ReportUserDTO {
  id?: string;
  name: string;
  role: string;
}

export class ReportService {
  /**
   * Return available parks and their locations
   */
  static getParks(): ParkConfig[] {
    return PARKS_CONFIG;
  }

  /**
   * Get high-level summary metrics derived from database for the Park Manager dashboard
   */
  static async getAnalyticsSummary(parkFilter?: string) {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      return {
        totalIncidents: 0,
        totalPatrols: 0,
        patrolDistanceKm: 0,
        totalConflicts: 0,
        highRiskAreas: [],
        incidentsByType: [],
        conflictsBySpecies: [],
        patrolsBySector: [],
        dbConnected: false,
      };
    }

    const parkQuery: any =
      parkFilter && parkFilter !== 'All Parks'
        ? parkFilter === 'Yala National Park'
          ? { $or: [{ park: parkFilter }, { park: { $exists: false } }] }
          : { park: parkFilter }
        : {};

    // 1. Total Incidents
    const [incidentsCount, incidentsByTypeAgg] = await Promise.all([
      Incident.countDocuments(parkQuery),
      Incident.aggregate([
        { $match: parkQuery },
        { $group: { _id: '$incidentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // 2. Patrols
    const [patrolsCount, patrolStatsAgg, patrolsBySectorAgg] = await Promise.all([
      Patrol.countDocuments(parkQuery),
      Patrol.aggregate([
        { $match: parkQuery },
        { $group: { _id: null, totalDistance: { $sum: '$distanceKm' } } },
      ]),
      Patrol.aggregate([
        { $match: parkQuery },
        { $group: { _id: '$sector', count: { $sum: 1 }, totalKm: { $sum: '$distanceKm' } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    const totalPatrolDistance = patrolStatsAgg[0]?.totalDistance || 0;

    // 3. Human-Wildlife Conflicts
    const [conflictsCount, conflictsBySpeciesAgg, conflictsBySeverityAgg] = await Promise.all([
      CommunityReport.countDocuments(parkQuery),
      CommunityReport.aggregate([
        { $match: parkQuery },
        { $group: { _id: '$animalSpecies', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      CommunityReport.aggregate([
        { $match: parkQuery },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // 4. Hotspots / High-Risk areas derived from incident locations and conflict locations
    const incidentLocations = await Incident.aggregate([
      { $match: parkQuery },
      {
        $group: {
          _id: { $ifNull: ['$location.addressSummary', 'General Park Beat'] },
          incidentCount: { $sum: 1 },
        },
      },
      { $sort: { incidentCount: -1 } },
      { $limit: 5 },
    ]);

    const conflictLocations = await CommunityReport.aggregate([
      { $match: parkQuery },
      {
        $group: {
          _id: '$locationName',
          conflictCount: { $sum: 1 },
        },
      },
      { $sort: { conflictCount: -1 } },
      { $limit: 5 },
    ]);

    // Combine high risk locations
    const locationMap: Record<string, { location: string; incidents: number; conflicts: number; totalAlerts: number }> = {};

    incidentLocations.forEach((item) => {
      const loc = item._id || 'General Park Beat';
      locationMap[loc] = {
        location: loc,
        incidents: item.incidentCount,
        conflicts: 0,
        totalAlerts: item.incidentCount,
      };
    });

    conflictLocations.forEach((item) => {
      const loc = item._id || 'Boundary Zone';
      if (locationMap[loc]) {
        locationMap[loc].conflicts = item.conflictCount;
        locationMap[loc].totalAlerts += item.conflictCount;
      } else {
        locationMap[loc] = {
          location: loc,
          incidents: 0,
          conflicts: item.conflictCount,
          totalAlerts: item.conflictCount,
        };
      }
    });

    const highRiskAreas = Object.values(locationMap)
      .sort((a, b) => b.totalAlerts - a.totalAlerts)
      .slice(0, 6);

    return {
      totalIncidents: incidentsCount,
      totalPatrols: patrolsCount,
      patrolDistanceKm: Math.round(totalPatrolDistance * 10) / 10,
      totalConflicts: conflictsCount,
      highRiskAreas,
      incidentsByType: incidentsByTypeAgg.map((i) => ({ type: i._id, count: i.count })),
      conflictsBySpecies: conflictsBySpeciesAgg.map((c) => ({ species: c._id, count: c.count })),
      conflictsBySeverity: conflictsBySeverityAgg.map((s) => ({ severity: s._id, count: s.count })),
      patrolsBySector: patrolsBySectorAgg.map((p) => ({ sector: p._id, count: p.count, totalKm: p.totalKm })),
      dbConnected: true,
    };
  }

  /**
   * UC04: Generate Conservation Report
   * Implements strict validation, criteria filtering, statistical derivation, and report formatting.
   */
  static async generateReport(criteria: GenerateReportDTO, user: ReportUserDTO) {
    const { park, startDate, endDate, location, sections } = criteria;

    // --- Validation 1: Required criteria ---
    if (!park || typeof park !== 'string' || park.trim().length === 0) {
      throw new Error('Please select a valid national park.');
    }

    if (!startDate || !endDate) {
      throw new Error('Both start date and end date are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Please provide valid start and end dates.');
    }

    // --- Validation 2: Invalid Date Range (end date < start date) ---
    if (end < start) {
      throw new Error('Invalid date range: End date cannot be before start date.');
    }

    // Set end date to end of day to include all records on that date
    end.setHours(23, 59, 59, 999);

    // --- Validation 3: No Report Section Selected ---
    const VALID_SECTIONS: ReportSection[] = [
      'incidentStatistics',
      'patrolCoverage',
      'conflictTrends',
    ];

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new Error('Please select at least one report section.');
    }

    const filteredSections = sections.filter((s) => VALID_SECTIONS.includes(s));
    if (filteredSections.length === 0) {
      throw new Error('Please select at least one valid report section.');
    }

    const isAllAreas = !location || location === 'All Areas' || location === 'ALL';

    // --- Data Retrieval & Filtering ---
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      throw new Error('Unable to retrieve conservation data: Database is currently disconnected.');
    }

    let incidentStatsData: any = null;
    let patrolCoverageData: any = null;
    let conflictTrendsData: any = null;

    let totalRecordsCount = 0;

    // --- SECTION 1: Incident Statistics ---
    if (filteredSections.includes('incidentStatistics')) {
      const incidentFilter: any = {
        reportedAt: { $gte: start, $lte: end },
      };

      if (park !== 'All Parks') {
        if (park === 'Yala National Park') {
          incidentFilter.$or = [{ park: park }, { park: { $exists: false } }];
        } else {
          incidentFilter.park = park;
        }
      }

      if (!isAllAreas) {
        incidentFilter['location.addressSummary'] = { $regex: location, $options: 'i' };
      }

      const incidents = await Incident.find(incidentFilter).sort({ reportedAt: -1 }).lean();
      totalRecordsCount += incidents.length;

      // Calculate statistics by type
      const byTypeMap: Record<string, number> = {};
      const byLocationMap: Record<string, number> = {};
      const byDateMap: Record<string, number> = {};
      const byStatusMap: Record<string, number> = {};

      incidents.forEach((inc) => {
        // By Type
        byTypeMap[inc.incidentType] = (byTypeMap[inc.incidentType] || 0) + 1;

        // By Location
        const loc = inc.location?.addressSummary || 'Unspecified Sector';
        byLocationMap[loc] = (byLocationMap[loc] || 0) + 1;

        // By Date (YYYY-MM-DD)
        const dateStr = new Date(inc.reportedAt).toISOString().split('T')[0];
        byDateMap[dateStr] = (byDateMap[dateStr] || 0) + 1;

        // By Status
        byStatusMap[inc.status] = (byStatusMap[inc.status] || 0) + 1;
      });

      incidentStatsData = {
        totalCount: incidents.length,
        byType: Object.entries(byTypeMap).map(([type, count]) => ({ type, count })),
        byLocation: Object.entries(byLocationMap).map(([loc, count]) => ({ location: loc, count })),
        byDate: Object.entries(byDateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        byStatus: Object.entries(byStatusMap).map(([status, count]) => ({ status, count })),
        records: incidents.slice(0, 50).map((inc) => ({
          id: inc.incidentId,
          type: inc.incidentType,
          ranger: inc.rangerName,
          location: inc.location?.addressSummary || `${inc.location?.latitude.toFixed(4)}, ${inc.location?.longitude.toFixed(4)}`,
          coordinates: inc.location ? { latitude: inc.location.latitude, longitude: inc.location.longitude } : undefined,
          status: inc.status,
          date: inc.reportedAt,
          description: inc.description,
        })),
      };
    }

    // --- SECTION 2: Patrol Coverage ---
    if (filteredSections.includes('patrolCoverage')) {
      const patrolFilter: any = {
        startTime: { $gte: start, $lte: end },
      };

      if (park !== 'All Parks') {
        patrolFilter.park = park;
      }

      if (!isAllAreas) {
        patrolFilter.sector = { $regex: location, $options: 'i' };
      }

      const patrols = await Patrol.find(patrolFilter).sort({ startTime: -1 }).lean();
      totalRecordsCount += patrols.length;

      const bySectorMap: Record<string, { count: number; distanceKm: number }> = {};
      const byTypeMap: Record<string, number> = {};
      const byDateMap: Record<string, number> = {};
      let totalDistance = 0;

      patrols.forEach((patrol) => {
        totalDistance += patrol.distanceKm || 0;

        // By Sector
        const sec = patrol.sector || 'General Sector';
        if (!bySectorMap[sec]) {
          bySectorMap[sec] = { count: 0, distanceKm: 0 };
        }
        bySectorMap[sec].count += 1;
        bySectorMap[sec].distanceKm += patrol.distanceKm || 0;

        // By Type
        byTypeMap[patrol.patrolType] = (byTypeMap[patrol.patrolType] || 0) + 1;

        // By Date
        const dateStr = new Date(patrol.startTime).toISOString().split('T')[0];
        byDateMap[dateStr] = (byDateMap[dateStr] || 0) + 1;
      });

      patrolCoverageData = {
        totalPatrols: patrols.length,
        totalDistanceKm: Math.round(totalDistance * 10) / 10,
        bySector: Object.entries(bySectorMap).map(([sector, data]) => ({
          sector,
          count: data.count,
          distanceKm: Math.round(data.distanceKm * 10) / 10,
        })),
        byType: Object.entries(byTypeMap).map(([type, count]) => ({ type, count })),
        byDate: Object.entries(byDateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        records: patrols.slice(0, 50).map((p) => ({
          id: p.patrolId,
          ranger: p.rangerName,
          sector: p.sector,
          type: p.patrolType,
          distanceKm: p.distanceKm,
          status: p.status,
          date: p.startTime,
        })),
      };
    }

    // --- SECTION 3: Human-Wildlife Conflict Trends ---
    if (filteredSections.includes('conflictTrends')) {
      const conflictFilter: any = {
        reportedAt: { $gte: start, $lte: end },
      };

      if (park !== 'All Parks') {
        conflictFilter.park = park;
      }

      if (!isAllAreas) {
        conflictFilter.locationName = { $regex: location, $options: 'i' };
      }

      const conflicts = await CommunityReport.find(conflictFilter).sort({ reportedAt: -1 }).lean();
      totalRecordsCount += conflicts.length;

      const byTypeMap: Record<string, number> = {};
      const bySpeciesMap: Record<string, number> = {};
      const bySeverityMap: Record<string, number> = {};
      const byLocationMap: Record<string, number> = {};
      const byDateMap: Record<string, number> = {};

      conflicts.forEach((conf) => {
        byTypeMap[conf.conflictType] = (byTypeMap[conf.conflictType] || 0) + 1;
        bySpeciesMap[conf.animalSpecies] = (bySpeciesMap[conf.animalSpecies] || 0) + 1;
        bySeverityMap[conf.severity] = (bySeverityMap[conf.severity] || 0) + 1;
        byLocationMap[conf.locationName] = (byLocationMap[conf.locationName] || 0) + 1;

        const dateStr = new Date(conf.reportedAt).toISOString().split('T')[0];
        byDateMap[dateStr] = (byDateMap[dateStr] || 0) + 1;
      });

      conflictTrendsData = {
        totalConflicts: conflicts.length,
        byType: Object.entries(byTypeMap).map(([type, count]) => ({ type, count })),
        bySpecies: Object.entries(bySpeciesMap).map(([species, count]) => ({ species, count })),
        bySeverity: Object.entries(bySeverityMap).map(([severity, count]) => ({ severity, count })),
        byLocation: Object.entries(byLocationMap).map(([loc, count]) => ({ location: loc, count })),
        byDate: Object.entries(byDateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        records: conflicts.slice(0, 50).map((c) => ({
          id: c.reportId,
          type: c.conflictType,
          species: c.animalSpecies,
          severity: c.severity,
          location: c.locationName,
          status: c.status,
          date: c.reportedAt,
          description: c.description,
        })),
      };
    }

    // --- Validation: No Matching Data ---
    if (totalRecordsCount === 0) {
      return {
        noData: true,
        message: 'No conservation data found for the selected criteria.',
        criteria: {
          park,
          startDate,
          endDate,
          location: isAllAreas ? 'All Areas' : location,
          sections: filteredSections,
        },
      };
    }

    // --- Generate Report Metadata & Save Audit Record ---
    const reportId = `CR-${Date.now().toString().slice(-6)}`;
    const generatedAt = new Date();

    const reportDocument = new ConservationReport({
      reportId,
      generatedBy: {
        userId: user.id,
        name: user.name,
        role: user.role,
      },
      park,
      dateRange: {
        startDate: start,
        endDate: end,
      },
      location: isAllAreas ? 'All Areas' : location,
      sections: filteredSections,
      generatedAt,
      summary: {
        totalIncidents: incidentStatsData?.totalCount || 0,
        totalPatrols: patrolCoverageData?.totalPatrols || 0,
        totalPatrolDistanceKm: patrolCoverageData?.totalDistanceKm || 0,
        totalConflicts: conflictTrendsData?.totalConflicts || 0,
      },
      dataPayload: {
        incidentStatistics: incidentStatsData,
        patrolCoverage: patrolCoverageData,
        conflictTrends: conflictTrendsData,
      },
    });

    await reportDocument.save();

    return {
      noData: false,
      reportId,
      park,
      dateRange: {
        startDate,
        endDate,
      },
      location: isAllAreas ? 'All Areas' : location,
      sections: filteredSections,
      generatedAt: generatedAt.toISOString(),
      generatedBy: user.name,
      summary: reportDocument.summary,
      incidentStatistics: incidentStatsData,
      patrolCoverage: patrolCoverageData,
      conflictTrends: conflictTrendsData,
    };
  }

  /**
   * Get past generated reports
   */
  static async getReports(parkFilter?: string) {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) return [];

    const query = parkFilter && parkFilter !== 'All Parks' ? { park: parkFilter } : {};
    return ConservationReport.find(query).sort({ generatedAt: -1 }).limit(20).lean();
  }

  /**
   * Get single report by reportId
   */
  static async getReportById(reportId: string) {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) return null;

    return ConservationReport.findOne({ reportId }).lean();
  }
}
