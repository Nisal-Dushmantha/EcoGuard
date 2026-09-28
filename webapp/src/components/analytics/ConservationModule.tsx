import React, { useState, useEffect } from 'react';
import type { ParkConfig, AnalyticsSummary, ReportCriteria, GeneratedReport } from '../../types/reports';
import { reportService } from '../../services/reportService';
import { ConservationDashboard } from './ConservationDashboard';
import { ReportConfigForm } from './ReportConfigForm';
import { ReportView } from './ReportView';

interface ConservationModuleProps {
  userPark?: string;
  userName: string;
  userRole: string;
}

export const ConservationModule: React.FC<ConservationModuleProps> = ({
  userPark,
  userName,
  userRole,
}) => {
  const [subView, setSubView] = useState<'dashboard' | 'generate'>('dashboard');

  // Parks data
  const [parks, setParks] = useState<ParkConfig[]>([]);
  const [selectedPark, setSelectedPark] = useState<string>(userPark || 'Yala National Park');

  // Dashboard summary data
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Generated Report state
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // 1. Load parks on mount
  useEffect(() => {
    let isMounted = true;
    const loadParks = async () => {
      try {
        const parkList = await reportService.getParks();
        if (isMounted && parkList.length > 0) {
          setParks(parkList);
          if (!userPark) {
            setSelectedPark(parkList[0].name);
          }
        }
      } catch (err: any) {
        console.error('Error loading parks:', err);
      }
    };
    loadParks();
    return () => {
      isMounted = false;
    };
  }, [userPark]);

  // 2. Load dashboard summary when selectedPark changes
  const fetchSummary = async (parkToFetch = selectedPark) => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await reportService.getAnalyticsSummary(parkToFetch);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load summary:', err);
      setSummaryError(err.message || 'Unable to connect to central database.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedPark);
  }, [selectedPark]);

  // Handle Park change on dashboard
  const handleSelectPark = (parkName: string) => {
    setSelectedPark(parkName);
  };

  // Handle Generate Report Request
  const handleGenerateReport = async (criteria: ReportCriteria) => {
    setIsGenerating(true);
    setReportError(null);
    try {
      const generated = await reportService.generateReport(criteria);
      setCurrentReport(generated);
    } catch (err: any) {
      console.error('Report generation error:', err);
      setReportError(err.message || 'Data retrieval failure: Unable to generate conservation report.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Regenerate Report (back to config form)
  const handleRegenerate = () => {
    setCurrentReport(null);
    setSubView('generate');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Module Navigation Tabs */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn-secondary ${subView === 'dashboard' && !currentReport ? 'active-tab-btn' : ''}`}
            onClick={() => {
              setCurrentReport(null);
              setSubView('dashboard');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: subView === 'dashboard' && !currentReport ? 'var(--primary)' : undefined,
              color: subView === 'dashboard' && !currentReport ? '#fff' : undefined,
              border: subView === 'dashboard' && !currentReport ? '1px solid var(--primary)' : undefined,
            }}
          >
            <span>📊</span>
            <span>Analytics Dashboard</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${subView === 'generate' || currentReport ? 'active-tab-btn' : ''}`}
            onClick={() => {
              setSubView('generate');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: subView === 'generate' || currentReport ? 'var(--primary)' : undefined,
              color: subView === 'generate' || currentReport ? '#fff' : undefined,
              border: subView === 'generate' || currentReport ? '1px solid var(--primary)' : undefined,
            }}
          >
            <span>📝</span>
            <span>{currentReport ? 'Generated Report' : 'Generate Report (UC04)'}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Assigned to <strong>{userName}</strong> ({userRole}) • Central Operations
        </div>
      </div>

      {/* Main View Area */}
      {subView === 'dashboard' && !currentReport ? (
        <ConservationDashboard
          summary={summary}
          isLoading={isSummaryLoading}
          error={summaryError}
          parks={parks}
          selectedPark={selectedPark}
          onSelectPark={handleSelectPark}
          onOpenReportGenerator={() => setSubView('generate')}
          onRefresh={() => fetchSummary(selectedPark)}
        />
      ) : currentReport ? (
        <ReportView report={currentReport} onRegenerate={handleRegenerate} />
      ) : (
        <ReportConfigForm
          parks={parks}
          defaultPark={userPark || selectedPark}
          onGenerate={handleGenerateReport}
          isLoading={isGenerating}
          validationError={reportError}
          onClearError={() => setReportError(null)}
        />
      )}
    </div>
  );
};
