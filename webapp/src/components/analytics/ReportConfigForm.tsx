import { Icon } from '../layout/Icon';
import React, { useState } from 'react';
import type { ParkConfig, ReportCriteria, ReportSectionType } from '../../types/reports';

interface ReportConfigFormProps {
  parks: ParkConfig[];
  defaultPark?: string;
  onGenerate: (criteria: ReportCriteria) => void;
  isLoading: boolean;
  validationError: string | null;
  onClearError: () => void;
}

export const ReportConfigForm: React.FC<ReportConfigFormProps> = ({
  parks,
  defaultPark,
  onGenerate,
  isLoading,
  validationError,
  onClearError,
}) => {
  // 1. Park selection
  const [selectedPark, setSelectedPark] = useState<string>(
    defaultPark || (parks.length > 0 ? parks[0].name : 'Yala National Park')
  );

  // 2. Date Range selection (default to past 30 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // 3. Location selection
  const [selectedLocation, setSelectedLocation] = useState<string>('All Areas');

  // 4. Report Sections selection (Checkboxes)
  const [sections, setSections] = useState<ReportSectionType[]>([
    'incidentStatistics',
    'patrolCoverage',
    'conflictTrends',
  ]);

  // Local form validation message
  const [localError, setLocalError] = useState<string | null>(null);

  // Available locations for the currently selected park
  const currentParkConfig = parks.find((p) => p.name === selectedPark);
  const availableLocations = currentParkConfig ? currentParkConfig.locations : [];

  // When park changes, reset location to 'All Areas'
  const handleParkChange = (parkName: string) => {
    setSelectedPark(parkName);
    setSelectedLocation('All Areas');
    setLocalError(null);
    onClearError();
  };

  const handleToggleSection = (section: ReportSectionType) => {
    setLocalError(null);
    onClearError();
    if (sections.includes(section)) {
      setSections(sections.filter((s) => s !== section));
    } else {
      setSections([...sections, section]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();

    // UC04 Exception Handling: Invalid Date Range
    if (!startDate || !endDate) {
      setLocalError('Please select both a start date and an end date.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setLocalError('Invalid date range: End date cannot be before start date.');
      return;
    }

    // UC04 Exception Handling: No Report Section Selected
    if (sections.length === 0) {
      setLocalError('Please select at least one report section to include in the report.');
      return;
    }

    onGenerate({
      park: selectedPark,
      startDate,
      endDate,
      location: selectedLocation,
      sections,
    });
  };

  const activeError = localError || validationError;

  return (
    <div className="glass-panel report-config" style={{ padding: '2rem', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="studio-icon"><Icon name="report" size={25}/></span>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Build your conservation report
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Select national park, reporting period, location, and required analytical sections
            </p>
          </div>
        </div>
      </div>

      {activeError && (
        <div
          className="alert-error"
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--alert-err-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <Icon name="alert" size={16}/>
          <span>{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Step 1: Select Park */}
        <div className="form-group">
          <label className="form-label" htmlFor="park-select" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="pin" size={16}/>
            <span>1. National Park</span>
          </label>
          <select
            id="park-select"
            className="form-input"
            value={selectedPark}
            onChange={(e) => handleParkChange(e.target.value)}
            disabled={isLoading}
            style={{ cursor: 'pointer' }}
          >
            {parks.length > 0 ? (
              parks.map((park) => (
                <option key={park.id} value={park.name}>
                  {park.name} ({park.code}) — {park.province}
                </option>
              ))
            ) : (
              <option value="Yala National Park">Yala National Park</option>
            )}
          </select>
        </div>

        {/* Step 2: Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="start-date" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="report" size={16}/>
              <span>2. Start Date</span>
            </label>
            <input
              id="start-date"
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setLocalError(null);
                onClearError();
              }}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="end-date" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="report" size={16}/>
              <span>End Date</span>
            </label>
            <input
              id="end-date"
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setLocalError(null);
                onClearError();
              }}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Step 3: Location / All Areas */}
        <div className="form-group">
          <label className="form-label" htmlFor="location-select" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="pin" size={16}/>
            <span>3. Sector / Location</span>
          </label>
          <select
            id="location-select"
            className="form-input"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            disabled={isLoading}
            style={{ cursor: 'pointer' }}
          >
            <option value="All Areas">All Areas (Entire Park-Wide Scope)</option>
            {availableLocations
              .filter((loc) => loc.name !== 'All Areas')
              .map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
          </select>
        </div>

        {/* Step 4: Report Sections Selection */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Icon name="grid" size={16}/>
            <span>4. Required Report Sections (Select one or more)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem' }}>
            {/* Section 1: Incident Statistics */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: sections.includes('incidentStatistics') ? 'var(--primary-subtle)' : 'var(--bg-input)',
                border: `1px solid ${sections.includes('incidentStatistics') ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={sections.includes('incidentStatistics')}
                onChange={() => handleToggleSection('incidentStatistics')}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Incident statistics
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Anti-poaching logs, snares, carcass detections & violation types
                </div>
              </div>
            </label>

            {/* Section 2: Patrol Coverage */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: sections.includes('patrolCoverage') ? 'var(--primary-subtle)' : 'var(--bg-input)',
                border: `1px solid ${sections.includes('patrolCoverage') ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={sections.includes('patrolCoverage')}
                onChange={() => handleToggleSection('patrolCoverage')}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Patrol coverage
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Ranger patrol hours, distance traversed & sector distribution
                </div>
              </div>
            </label>

            {/* Section 3: Human-Wildlife Conflict Trends */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: sections.includes('conflictTrends') ? 'var(--primary-subtle)' : 'var(--bg-input)',
                border: `1px solid ${sections.includes('conflictTrends') ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={sections.includes('conflictTrends')}
                onChange={() => handleToggleSection('conflictTrends')}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Human–wildlife conflicts
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Community dispute logs, crop raiding, species & severity trends
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{
              padding: '0.75rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.95rem',
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                <span>Validating & Compiling Report...</span>
              </>
            ) : (
              <>
                <Icon name="report" size={18}/>
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
