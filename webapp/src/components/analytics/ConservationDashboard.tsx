import React from 'react';
import type { AnalyticsSummary, ParkConfig } from '../../types/reports';
import { BarChart, DonutChart } from './Charts';

interface ConservationDashboardProps {
  summary: AnalyticsSummary | null;
  isLoading: boolean;
  error: string | null;
  parks: ParkConfig[];
  selectedPark: string;
  onSelectPark: (park: string) => void;
  onOpenReportGenerator: () => void;
  onRefresh: () => void;
}

export const ConservationDashboard: React.FC<ConservationDashboardProps> = ({
  summary,
  isLoading,
  error,
  parks,
  selectedPark,
  onSelectPark,
  onOpenReportGenerator,
  onRefresh,
}) => {
  if (isLoading && !summary) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem', margin: '0 auto 1rem auto' }}></div>
        <div>Loading live conservation analytics from central database...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ fontSize: '1.2rem', color: '#f87171', marginBottom: '0.5rem' }}>
          Unable to retrieve conservation data.
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  const s = summary || {
    totalIncidents: 0,
    totalPatrols: 0,
    patrolDistanceKm: 0,
    totalConflicts: 0,
    highRiskAreas: [],
    incidentsByType: [],
    conflictsBySpecies: [],
    conflictsBySeverity: [],
    patrolsBySector: [],
    dbConnected: false,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Top Filter & Actions Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderRadius: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Executive Wildlife Operations Overview
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            Conservation Analytics Dashboard
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Park Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Park:</span>
            <select
              className="form-input"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', width: 'auto', cursor: 'pointer' }}
              value={selectedPark}
              onChange={(e) => onSelectPark(e.target.value)}
            >
              <option value="All Parks">All National Parks (National Scope)</option>
              {parks.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={onOpenReportGenerator}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <span>📄</span>
            <span>Generate UC04 Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Total Incidents */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderLeft: '4px solid #ef4444',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Incidents
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {s.totalIncidents}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🚨
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
            Snares, poaching signs & casualties from field rangers (UC01)
          </div>
        </div>

        {/* Card 2: Patrol Coverage */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Patrol Coverage
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {s.totalPatrols}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  ({s.patrolDistanceKm} km)
                </span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🛡️
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
            Completed ranger patrols & anti-poaching foot/vehicle tracks
          </div>
        </div>

        {/* Card 3: Human-Wildlife Conflicts */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Human-Wildlife Conflicts
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {s.totalConflicts}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🐘
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
            Crop raids, property damages & village complaints (UC03)
          </div>
        </div>

        {/* Card 4: High-Risk / Hotspot Areas */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderLeft: '4px solid #8b5cf6',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                High-Risk / Relevant Areas
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {s.highRiskAreas.length}{' '}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Sectors
                </span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              📍
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
            Identified areas with high incident and conflict density
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Incident Analytics Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              🚨 Incident Types Distribution
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {s.incidentsByType.length} categories
            </span>
          </div>

          <BarChart
            data={s.incidentsByType.map((i) => ({ label: i.type, value: i.count }))}
            color="#ef4444"
            emptyMessage="No incident records found in database for this park."
          />
        </div>

        {/* Conflict Species Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              🐘 Human-Wildlife Conflict Species
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {s.conflictsBySpecies.length} species
            </span>
          </div>

          <DonutChart
            data={s.conflictsBySpecies.map((c) => ({ label: c.species, value: c.count }))}
            emptyMessage="No community conflict records logged in database for this park."
          />
        </div>
      </div>

      {/* High-Risk Areas & Hotspots Table (Section 15: Poaching Hotspot / High-Risk Analysis) */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            🔥 High-Risk Hotspot Analysis
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Statistical density aggregation identifying priority patrol sectors and vulnerability zones
          </p>
        </div>

        {s.highRiskAreas.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No incident or conflict records available to rank high-risk sectors.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Sector / Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Incidents Logged</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Conflicts Logged</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Activity Points</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Priority Status</th>
                </tr>
              </thead>
              <tbody>
                {s.highRiskAreas.map((area, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      📍 {area.location}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f87171' }}>{area.incidents}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#fbbf24' }}>{area.conflicts}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{area.totalAlerts}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          background:
                            idx === 0
                              ? 'rgba(239, 68, 68, 0.2)'
                              : idx === 1
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                          color:
                            idx === 0 ? '#f87171' : idx === 1 ? '#fbbf24' : '#60a5fa',
                          fontWeight: 600,
                        }}
                      >
                        {idx === 0 ? 'CRITICAL ATTENTION' : idx === 1 ? 'ELEVATED RISK' : 'MONITORING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
