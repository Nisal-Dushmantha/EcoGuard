import { createConflictReport } from '../../modules/mobile/controllers/conflict.controller.js';
import { CommunityReport } from '../../models/CommunityReport.model.js';

jest.mock('../../models/CommunityReport.model.js');
jest.mock('../../models/User.model.js');

describe('UC03 - Backend Conflict Validation Unit Tests', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      user: { id: 'usr-123', name: 'John Farmer' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('1. Positive: creates a valid conflict report with PENDING status ("Pending Verification")', async () => {
    req.body = {
      reporterName: 'Sunil Perera',
      contactNumber: '0771234567',
      conflictType: 'Crop Raiding',
      animalSpecies: 'Asian Elephant',
      severity: 'High',
      locationName: 'Mahasenpura Village',
      park: 'Yala National Park',
      latitude: 6.3712,
      longitude: 81.5204,
      description: 'An Asian Elephant damaged paddy fields.',
      photoUrl: 'http://example.com/photo.jpg',
    };

    const mockCreatedReport = {
      reportId: 'CR-2026-1001',
      ...req.body,
      status: 'Pending Verification',
      toObject: () => ({
        reportId: 'CR-2026-1001',
        ...req.body,
        status: 'Pending Verification',
      }),
    };

    (CommunityReport.create as jest.Mock).mockResolvedValue(mockCreatedReport);

    await createConflictReport(req, res);

    expect(CommunityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: 'Sunil Perera',
        contactNumber: '0771234567',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'High',
        locationName: 'Mahasenpura Village',
        park: 'Yala National Park',
        status: 'Pending Verification',
        description: 'An Asian Elephant damaged paddy fields.',
        coordinates: { latitude: 6.3712, longitude: 81.5204 },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Conflict report submitted successfully.',
        data: expect.objectContaining({
          status: 'Pending Verification',
        }),
      })
    );
  });

  it('2. Positive: links authenticated reporter details correctly when reporterName is omitted', async () => {
    req.body = {
      conflictType: 'Livestock Predation',
      locationName: 'Sector 4',
      description: 'Leopard attack reported.',
    };

    (CommunityReport.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({
        ...data,
        toObject: () => data,
      })
    );

    await createConflictReport(req, res);

    expect(CommunityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: 'John Farmer',
        reporterId: 'usr-123',
        status: 'Pending Verification',
      })
    );
  });

  it('3. Edge case: applies default values when optional fields are omitted', async () => {
    req.body = {
      description: 'Wild boar spotted near crop border.',
    };

    (CommunityReport.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({
        ...data,
        toObject: () => data,
      })
    );

    await createConflictReport(req, res);

    expect(CommunityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conflictType: 'Other Conflict',
        animalSpecies: 'Asian Elephant',
        severity: 'Medium',
        locationName: 'Local Sector',
        park: 'Yala National Park',
        status: 'Pending Verification',
        coordinates: undefined,
      })
    );
  });

  it('4. Edge case: handles invalid severity enum by falling back to "Medium"', async () => {
    req.body = {
      conflictType: 'Property Damage',
      severity: 'EXTREME_DANGER' as any,
      description: 'Fence destroyed.',
    };

    (CommunityReport.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({
        ...data,
        toObject: () => data,
      })
    );

    await createConflictReport(req, res);

    expect(CommunityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'Medium',
      })
    );
  });

  it('5. Positive: accepts valid conflict enum types (Crop Raiding, Property Damage, Livestock Predation, Human Threat/Encounter, Electric Fence Breach, Other Conflict)', async () => {
    const validTypes = [
      'Crop Raiding',
      'Property Damage',
      'Livestock Predation',
      'Human Threat/Encounter',
      'Electric Fence Breach',
      'Other Conflict',
    ];

    for (const cType of validTypes) {
      req.body = { conflictType: cType, description: `Test for ${cType}` };

      (CommunityReport.create as jest.Mock).mockImplementation((data) =>
        Promise.resolve({ ...data, toObject: () => data })
      );

      await createConflictReport(req, res);

      expect(CommunityReport.create).toHaveBeenCalledWith(
        expect.objectContaining({ conflictType: cType })
      );
    }
  });

  it('6. Error case: handles database creation failure gracefully', async () => {
    req.body = {
      conflictType: 'Crop Raiding',
      description: 'Test crash',
    };

    (CommunityReport.create as jest.Mock).mockRejectedValue(new Error('Database disk error'));

    await createConflictReport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Database disk error',
      })
    );
  });
});
