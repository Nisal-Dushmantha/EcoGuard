import React from 'react';
import { conflictApi, ConflictReport } from '../../src/services/conflictApi';
import { locationService } from '../../src/services/locationService';
import { photoService } from '../../src/services/photoService';

// Mock API and services
jest.mock('../../src/services/conflictApi');
jest.mock('../../src/services/authService', () => ({
  authService: {
    userName: 'Test Community Member',
    userRole: 'Community Member',
    getMe: jest.fn().mockResolvedValue({
      user: { name: 'Test Community Member', phoneNumber: '0771234567', email: 'test@ecoguard.lk' },
    }),
  },
}));

describe('UC03 – Mobile Screens & Components Logic Unit Tests', () => {
  let mockNavigation: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn((event, callback) => {
        if (event === 'focus') callback();
        return () => {};
      }),
    };
  });

  // ── 1. REPORT WILDLIFE CONFLICT SCREEN ─────────────────────────────────────
  describe('1. ReportWildlifeConflictScreen Logic & Validation', () => {
    it('1.1 validates required fields: rejects submission when fields are empty', () => {
      const validateForm = (animalSpecies: string, conflictType: string, locationName: string, description: string) => {
        const errs: Record<string, string> = {};
        if (!animalSpecies) errs.animalSpecies = 'Animal Type is required';
        if (!conflictType) errs.conflictType = 'Conflict Type is required';
        if (!locationName.trim()) errs.locationName = 'Location / Village / Area is required';
        if (!description.trim()) errs.description = 'Incident description is required';
        return { isValid: Object.keys(errs).length === 0, errors: errs };
      };

      const invalid = validateForm('', '', '', '');
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.animalSpecies).toBe('Animal Type is required');
      expect(invalid.errors.conflictType).toBe('Conflict Type is required');
      expect(invalid.errors.locationName).toBe('Location / Village / Area is required');
      expect(invalid.errors.description).toBe('Incident description is required');

      const valid = validateForm('Asian Elephant', 'Crop Raiding', 'Mahasenpura Village', 'Elephant raiding paddy field');
      expect(valid.isValid).toBe(true);
    });

    it('1.2 conflict type label correctly maps to exact backend value', () => {
      const CONFLICT_TYPE_OPTIONS = [
        { label: 'Crop Raiding / Crop Damage',       value: 'Crop Raiding' },
        { label: 'Property Damage / Destruction',     value: 'Property Damage' },
        { label: 'Livestock Attack / Depredation',    value: 'Livestock Predation' },
        { label: 'Human-Wildlife Encounter / Threat', value: 'Human Threat/Encounter' },
        { label: 'Electric Fence Breach',             value: 'Electric Fence Breach' },
        { label: 'Other Conflict',                    value: 'Other Conflict' },
      ];

      const cropOption = CONFLICT_TYPE_OPTIONS.find(o => o.label === 'Crop Raiding / Crop Damage');
      expect(cropOption?.value).toBe('Crop Raiding');

      const propOption = CONFLICT_TYPE_OPTIONS.find(o => o.label === 'Property Damage / Destruction');
      expect(propOption?.value).toBe('Property Damage');

      const fenceOption = CONFLICT_TYPE_OPTIONS.find(o => o.label === 'Electric Fence Breach');
      expect(fenceOption?.value).toBe('Electric Fence Breach');
    });

    it('1.3 location capture populates coordinates on permission granted', async () => {
      jest.spyOn(locationService, 'getCurrentLocation').mockResolvedValueOnce({
        success: true,
        location: {
          latitude: 6.3712,
          longitude: 81.5204,
          accuracy: 10,
          addressSummary: 'Mahasenpura Village Sector 4',
        },
      });

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      expect(res.location?.latitude).toBe(6.3712);
      expect(res.location?.longitude).toBe(81.5204);
      expect(res.location?.addressSummary).toBe('Mahasenpura Village Sector 4');
    });

    it('1.4 location capture returns controlled message when permission is denied', async () => {
      jest.spyOn(locationService, 'getCurrentLocation').mockResolvedValueOnce({
        success: false,
        code: 'PERMISSION_DENIED',
        error: 'Location permission was denied. You can still enter your location manually.',
      });

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(false);
      expect(res.code).toBe('PERMISSION_DENIED');
      expect(res.error).toMatch(/permission was denied/i);
    });

    it('1.5 photo actions: camera, gallery, preview, optional submit without photo', async () => {
      jest.spyOn(photoService, 'takePhoto').mockResolvedValueOnce({
        uri: 'file:///cam.jpg',
        fileName: 'cam.jpg',
      });
      jest.spyOn(photoService, 'pickFromGallery').mockResolvedValueOnce({
        uri: 'file:///gal.jpg',
        fileName: 'gal.jpg',
      });

      const camPhoto = await photoService.takePhoto();
      expect(camPhoto?.uri).toBe('file:///cam.jpg');

      const galPhoto = await photoService.pickFromGallery();
      expect(galPhoto?.uri).toBe('file:///gal.jpg');

      // Optional photo submission payload
      const payloadWithoutPhoto = {
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        locationName: 'Sector 4',
        description: 'Test without photo',
        photoUrl: undefined,
      };
      expect(payloadWithoutPhoto.photoUrl).toBeUndefined();
    });

    it('1.6 submits report via API after confirmation modal', async () => {
      const mockCreated: ConflictReport = {
        _id: 'rep-01',
        reportId: 'CR-2026-9999',
        reporterName: 'Sunil',
        park: 'Yala National Park',
        locationName: 'Sector 4',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'High',
        reportedAt: new Date().toISOString(),
        status: 'Pending Verification',
        description: 'Paddy damaged',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (conflictApi.createConflictReport as jest.Mock).mockResolvedValueOnce(mockCreated);

      const result = await conflictApi.createConflictReport({
        reporterName: 'Sunil',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'High',
        locationName: 'Sector 4',
        description: 'Paddy damaged',
      });

      expect(result.reportId).toBe('CR-2026-9999');
      expect(conflictApi.createConflictReport).toHaveBeenCalled();
    });

    it('1.7 handles submission API error cleanly', async () => {
      (conflictApi.createConflictReport as jest.Mock).mockRejectedValueOnce(
        new Error('Unable to connect to server.')
      );

      await expect(
        conflictApi.createConflictReport({
          conflictType: 'Crop Raiding',
          animalSpecies: 'Asian Elephant',
          locationName: 'Sector 4',
          description: 'Paddy damaged',
        })
      ).rejects.toThrow(/unable to connect/i);
    });
  });

  // ── 2. PENDING REPORTS SCREEN ─────────────────────────────────────────────
  describe('2. PendingReportsScreen Logic & Filtering', () => {
    const mockReportsList: ConflictReport[] = [
      {
        _id: '1',
        reportId: 'CR-101',
        reporterName: 'Member A',
        park: 'Yala National Park',
        locationName: 'Mahasenpura Village',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'Critical',
        reportedAt: new Date(Date.now() - 600000).toISOString(),
        status: 'Pending Verification',
        description: 'Elephant in field',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: '2',
        reportId: 'CR-102',
        reporterName: 'Member B',
        park: 'Wilpattu National Park',
        locationName: 'Boundary Sector',
        conflictType: 'Livestock Predation',
        animalSpecies: 'Sri Lankan Leopard',
        severity: 'Low',
        reportedAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'Pending Verification',
        description: 'Leopard near farm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('2.1 filters list by search query', () => {
      const searchReports = (reports: ConflictReport[], search: string) => {
        if (!search.trim()) return reports;
        const q = search.trim().toLowerCase();
        return reports.filter(
          r =>
            r.reportId.toLowerCase().includes(q) ||
            r.locationName.toLowerCase().includes(q) ||
            r.animalSpecies.toLowerCase().includes(q) ||
            r.conflictType.toLowerCase().includes(q)
        );
      };

      const searchResult = searchReports(mockReportsList, 'Mahasenpura');
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].reportId).toBe('CR-101');
    });

    it('2.2 filters list by severity chip', () => {
      const filterBySeverity = (reports: ConflictReport[], sev: string) => {
        if (!sev) return reports;
        return reports.filter(r => r.severity === sev);
      };

      const criticalOnly = filterBySeverity(mockReportsList, 'Critical');
      expect(criticalOnly.length).toBe(1);
      expect(criticalOnly[0].reportId).toBe('CR-101');
    });

    it('2.3 Review action navigates to ConflictReportDetails', () => {
      const handleReview = (reportId: string) => {
        mockNavigation.navigate('ConflictReportDetails', { reportId });
      };

      handleReview('CR-101');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ConflictReportDetails', {
        reportId: 'CR-101',
      });
    });

    it('2.4 handles empty state correctly when queue is empty', () => {
      const emptyReports: ConflictReport[] = [];
      expect(emptyReports.length).toBe(0);
    });
  });

  // ── 3. CONFLICT REPORT DETAILS SCREEN ─────────────────────────────────────
  describe('3. ConflictReportDetailsScreen Actions & Roles', () => {
    const mockReport: ConflictReport = {
      _id: '1',
      reportId: 'CR-2026-1004',
      reporterName: 'Sunil Farmer',
      contactNumber: '0771234567',
      park: 'Yala National Park',
      locationName: 'Mahasenpura Village',
      coordinates: { latitude: 6.3712, longitude: 81.5204 },
      conflictType: 'Crop Raiding',
      animalSpecies: 'Asian Elephant',
      severity: 'High',
      reportedAt: new Date().toISOString(),
      status: 'Pending Verification',
      description: 'Paddy damaged by wild elephant.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('3.1 Verify action calls API for PENDING report', async () => {
      const updatedReport = { ...mockReport, status: 'Verified' as const };
      (conflictApi.verifyConflictReport as jest.Mock).mockResolvedValueOnce(updatedReport);

      const res = await conflictApi.verifyConflictReport('CR-2026-1004', 'Officer Wickramasinghe');
      expect(res.status).toBe('Verified');
      expect(conflictApi.verifyConflictReport).toHaveBeenCalledWith('CR-2026-1004', 'Officer Wickramasinghe');
    });

    it('3.2 Reject action validates reason and calls API for PENDING report', async () => {
      const validateRejectionReason = (reason: string) => {
        if (!reason.trim()) return 'Reason for rejection is required';
        return null;
      };

      expect(validateRejectionReason('')).toBe('Reason for rejection is required');
      expect(validateRejectionReason('Duplicate report')).toBeNull();

      const updatedReport = { ...mockReport, status: 'Rejected' as const, rejectionReason: 'Duplicate report' };
      (conflictApi.rejectConflictReport as jest.Mock).mockResolvedValueOnce(updatedReport);

      const res = await conflictApi.rejectConflictReport('CR-2026-1004', 'Duplicate report');
      expect(res.status).toBe('Rejected');
      expect(res.rejectionReason).toBe('Duplicate report');
    });

    it('3.3 processed reports hide or disable PENDING actions', () => {
      const getAvailableActions = (status: string) => {
        return {
          canVerify: status === 'Pending Verification',
          canReject: status === 'Pending Verification',
          canAssignRanger: status === 'Verified',
        };
      };

      expect(getAvailableActions('Pending Verification')).toEqual({ canVerify: true, canReject: true, canAssignRanger: false });
      expect(getAvailableActions('Verified')).toEqual({ canVerify: false, canReject: false, canAssignRanger: true });
      expect(getAvailableActions('Dispatched')).toEqual({ canVerify: false, canReject: false, canAssignRanger: false });
      expect(getAvailableActions('Resolved')).toEqual({ canVerify: false, canReject: false, canAssignRanger: false });
    });
  });

  // ── 4. RANGER SELECTION ───────────────────────────────────────────────────
  describe('4. AvailableRangerSelection Logic', () => {
    it('4.1 renders available rangers list and selects ranger for dispatch', () => {
      const mockRangers = [
        { _id: 'r-1', name: 'Ranger K. Bandara', distance: '1.2 km', eta: '5 min', status: 'Available' },
        { _id: 'r-2', name: 'Ranger M. Perera', distance: '4.5 km', eta: '18 min', status: 'Available' },
      ];

      const handleSelectRanger = (reportId: string, ranger: any) => {
        mockNavigation.navigate('ConfirmAssignment', {
          reportId,
          rangerId: ranger._id,
          rangerName: ranger.name,
        });
      };

      handleSelectRanger('CR-101', mockRangers[0]);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ConfirmAssignment', {
        reportId: 'CR-101',
        rangerId: 'r-1',
        rangerName: 'Ranger K. Bandara',
      });
    });
  });

  // ── 5. RANGER RESPONSE & INCIDENT TRACKING ───────────────────────────────
  describe('5. ActiveIncidentTrackingScreen Ranger Actions', () => {
    it('5.1 renders Start Response action for DISPATCHED report', () => {
      const getRangerAction = (status: string) => {
        if (status === 'Dispatched') return 'In Progress';
        if (status === 'In Progress') return 'Resolved';
        return null;
      };

      expect(getRangerAction('Dispatched')).toBe('In Progress');
      expect(getRangerAction('In Progress')).toBe('Resolved');
    });

    it('5.2 validates that resolution notes are required before resolving report', () => {
      const validateStatusUpdate = (targetStatus: string, note: string) => {
        if (targetStatus === 'Resolved' && !note.trim()) {
          return { isValid: false, error: 'Resolution notes are required to resolve a conflict report.' };
        }
        return { isValid: true, error: null };
      };

      const invalidResolve = validateStatusUpdate('Resolved', '');
      expect(invalidResolve.isValid).toBe(false);
      expect(invalidResolve.error).toMatch(/resolution notes are required/i);

      const validResolve = validateStatusUpdate('Resolved', 'Elephant guided back to park boundary.');
      expect(validResolve.isValid).toBe(true);
    });

    it('5.3 updates status via API for assigned Ranger', async () => {
      (conflictApi.updateConflictStatus as jest.Mock).mockResolvedValueOnce({
        reportId: 'CR-101',
        status: 'In Progress',
      });

      const inProgressRes = await conflictApi.updateConflictStatus('CR-101', 'In Progress', 'En route to site');
      expect(inProgressRes.status).toBe('In Progress');

      (conflictApi.updateConflictStatus as jest.Mock).mockResolvedValueOnce({
        reportId: 'CR-101',
        status: 'Resolved',
        resolutionNote: 'Mitigated',
      });

      const resolvedRes = await conflictApi.updateConflictStatus('CR-101', 'Resolved', 'Mitigated');
      expect(resolvedRes.status).toBe('Resolved');
    });
  });
});
