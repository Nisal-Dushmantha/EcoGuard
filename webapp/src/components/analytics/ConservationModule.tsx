import React, { useState, useEffect } from 'react';
import type { ParkConfig, AnalyticsSummary, ReportCriteria, GeneratedReport } from '../../types/reports';
import { reportService } from '../../services/reportService';
import { ConservationDashboard } from './ConservationDashboard';
import { ReportConfigForm } from './ReportConfigForm';
import { ReportView } from './ReportView';

interface ConservationModuleProps {
  userPark?: string;
  userName: string;
  view: 'dashboard' | 'generate';
  onChangeView: (view: 'dashboard' | 'generate') => void;
}

export const ConservationModule: React.FC<ConservationModuleProps> = ({
  userPark,
  userName,
  view: subView,
  onChangeView: setSubView,
}) => {


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
      {subView === 'generate' && <div className="studio-heading no-print"><div className="section-kicker">FROM INSIGHT TO ACTION</div><h1>Report studio<span className="heading-dot">.</span></h1><p>A focused view of your park. Select a scope, choose your sections, and make the data useful.</p></div>}
      {/* Main View Area */}
      {subView === 'dashboard' ? (
        <ConservationDashboard
          userName={userName}
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
