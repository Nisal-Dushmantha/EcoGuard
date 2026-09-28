import React from 'react';
import type { GeneratedReport } from '../../types/reports';
import { BarChart, DonutChart, TimelineTrend, HotspotMap } from './Charts';

interface ReportViewProps {
  report: GeneratedReport;
  onRegenerate: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onRegenerate }) => {
  // Empty State Handling
  if (report.noData) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '3.5rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          No conservation data found for the selected criteria.
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.75rem auto', fontSize: '0.9rem' }}>
          There are currently no recorded field incidents, patrols, or community reports matching{' '}
          <strong>{report.park}</strong> ({report.location}) for the selected date window ({report.dateRange?.startDate} to {report.dateRange?.endDate}).
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={onRegenerate}
          style={{ padding: '0.75rem 1.75rem' }}
        >
          🔄 Modify Criteria & Try Again
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(report.generatedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="printable-report" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Action Bar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            Report Reference: <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{report.reportId}</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRegenerate}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <span>🔄</span>
            <span>Regenerate Report</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Report Header */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderTop: '5px solid var(--primary)',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <span style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Department of Wildlife Conservation • EcoGuard
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Official Conservation Report
            </h1>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Authorized Management & Resource Allocation Analysis
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <div><strong>Generated:</strong> {formattedDate}</div>
            <div><strong>Officer:</strong> {report.generatedBy}</div>
            <div><strong>System:</strong> EcoGuard Central v1.0</div>
          </div>
        </div>

        <div
          style={{
            margin: '1.5rem 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>National Park</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {report.park}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Reporting Period</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {report.dateRange.startDate} — {report.dateRange.endDate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Location / Sector</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {report.location}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Included Sections</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
              {report.sections.map((s, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 500,
                  }}
                >
                  {s === 'incidentStatistics'
                    ? 'Incidents'
                    : s === 'patrolCoverage'
                    ? 'Patrols'
                    : 'Conflicts'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* High-Level Summary Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {report.sections.includes('incidentStatistics') && (
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Incidents</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', marginTop: '0.25rem' }}>
                {report.summary.totalIncidents}
              </div>
            </div>
          )}

          {report.sections.includes('patrolCoverage') && (
            <>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patrol Missions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.25rem' }}>
                  {report.summary.totalPatrols}
                </div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage Distance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
                  {report.summary.totalPatrolDistanceKm} km
                </div>
              </div>
            </>
          )}

          {report.sections.includes('conflictTrends') && (
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Community Conflicts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.25rem' }}>
                {report.summary.totalConflicts}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Incident Statistics */}
      {report.sections.includes('incidentStatistics') && report.incidentStatistics && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🚨</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              1. Incident Statistics
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {report.incidentStatistics.totalCount} Logged
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* By Type */}
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Incidents by Type
              </h4>
              <BarChart
                data={report.incidentStatistics.byType.map((t) => ({ label: t.type, value: t.count }))}
                color="#ef4444"
              />
            </div>

            {/* By Location */}
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Incidents by Sector / Beat
              </h4>
              <BarChart
                data={report.incidentStatistics.byLocation.map((l) => ({ label: l.location, value: l.count }))}
                color="#f97316"
              />
            </div>
          </div>

          {/* Timeline Trend */}
          <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Incident Activity Over Time
            </h4>
            <TimelineTrend data={report.incidentStatistics.byDate} color="#ef4444" />
          </div>

          {/* Spatial Pins Map */}
          {report.incidentStatistics.records.length > 0 && (
            <HotspotMap
              parkName={report.park}
              items={report.incidentStatistics.records.map((r) => ({
                id: r.id,
                label: `${r.type} (${r.location})`,
                type: r.type,
                coordinates: r.coordinates,
                status: r.status,
              }))}
            />
          )}

          {/* Detailed Records Table */}
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Incident Audit Log (Field Logs from Mobile UC01)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Incident ID</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Type</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Ranger</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Location</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Reported At</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.incidentStatistics.records.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: 'var(--primary)' }}>{rec.id}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{rec.type}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{rec.ranger || 'Field Ranger'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{rec.location}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background:
                              rec.status === 'Resolved'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color: rec.status === 'Resolved' ? '#34d399' : '#f87171',
                            fontSize: '0.75rem',
                          }}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Patrol Coverage */}
      {report.sections.includes('patrolCoverage') && report.patrolCoverage && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              2. Patrol Coverage
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {report.patrolCoverage.totalPatrols} Missions • {report.patrolCoverage.totalDistanceKm} km
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Patrol Missions by Sector
              </h4>
              <BarChart
                data={report.patrolCoverage.bySector.map((s) => ({ label: s.sector, value: s.count }))}
                color="#3b82f6"
              />
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Patrol Modality Distribution
              </h4>
              <DonutChart
                data={report.patrolCoverage.byType.map((t) => ({ label: t.type, value: t.count }))}
              />
            </div>
          </div>

          {/* Activity Over Time */}
          <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Patrol Activity Timeline
            </h4>
            <TimelineTrend data={report.patrolCoverage.byDate} color="#3b82f6" />
          </div>

          {/* Patrol Records Table */}
          {report.patrolCoverage.records.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Patrol Mission Logs
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Patrol ID</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Ranger In-Charge</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Sector</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Modality</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Distance</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.patrolCoverage.records.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#60a5fa' }}>{p.id}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{p.ranger}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{p.sector}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{p.type}</td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{p.distanceKm} km</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              fontSize: '0.75rem',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Human-Wildlife Conflict Trends */}
      {report.sections.includes('conflictTrends') && report.conflictTrends && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🐘</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              3. Human-Wildlife Conflict Trends
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {report.conflictTrends.totalConflicts} Incidents (UC03)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Conflict Incidents by Species
              </h4>
              <DonutChart
                data={report.conflictTrends.bySpecies.map((s) => ({ label: s.species, value: s.count }))}
              />
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Conflict by Category
              </h4>
              <BarChart
                data={report.conflictTrends.byType.map((t) => ({ label: t.type, value: t.count }))}
                color="#f59e0b"
              />
            </div>
          </div>

          {/* Conflict Timeline */}
          <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Conflict Occurrence Timeline
            </h4>
            <TimelineTrend data={report.conflictTrends.byDate} color="#f59e0b" />
          </div>

          {/* Conflict Records Table */}
          {report.conflictTrends.records.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Community Conflict Incident Log
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Report ID</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Type</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Species</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Location</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Severity</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Reported At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.conflictTrends.records.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#fbbf24' }}>{c.id}</td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{c.type}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{c.species}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{c.location}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background:
                                c.severity === 'Critical'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color: c.severity === 'Critical' ? '#f87171' : '#fbbf24',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {c.severity}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(c.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Sign-off and Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}
      >
        <div>
          End of Conservation Report • Document Reference: <span style={{ fontFamily: 'monospace' }}>{report.reportId}</span>
        </div>
        <div>
          EcoGuard System — Department of Wildlife Conservation (Sri Lanka)
        </div>
      </div>
    </div>
  );
};
