import React, { useState, useEffect, useCallback } from 'react';
import { wildlifeService } from '../../services/wildlifeService';
import type {
  CollaredAnimal,
  RiskZone,
  WildlifeAlert,
  MonitoringOverview,
} from '../../types/wildlife';
import { Icon } from '../layout/Icon';
import { MonitoringDashboard } from './MonitoringDashboard';
import { AnimalTracking } from './AnimalTracking';
import { LiveMap } from './LiveMap';
import { RiskZonesView } from './RiskZonesView';
import { AlertsView } from './AlertsView';
import { AlertDetailsModal } from './AlertDetailsModal';
import './monitoring.css';

interface WildlifeModuleProps {
  userPark?: string;
  userName?: string;
}

export type MonitoringTab = 'dashboard' | 'tracking' | 'map' | 'zones' | 'alerts';

export const WildlifeModule: React.FC<WildlifeModuleProps> = ({
  userPark = 'Yala National Park',
  userName = 'Park Manager',
}) => {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('dashboard');
  const [selectedPark, setSelectedPark] = useState<string>(userPark || 'Yala National Park');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [animals, setAnimals] = useState<CollaredAnimal[]>([]);
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [alerts, setAlerts] = useState<WildlifeAlert[]>([]);

  const [selectedAlertForModal, setSelectedAlertForModal] = useState<WildlifeAlert | null>(null);
  const [selectedAnimalForModal, setSelectedAnimalForModal] = useState<CollaredAnimal | null>(null);

  // Load all telemetry & monitoring data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ovData, anData, znData, alData] = await Promise.all([
        wildlifeService.getOverview(selectedPark),
        wildlifeService.getAnimals({ park: selectedPark }),
        wildlifeService.getZones(selectedPark),
        wildlifeService.getAlerts({ park: selectedPark }),
      ]);
      setOverview(ovData);
      setAnimals(anData);
      setZones(znData);
      setAlerts(alData);
    } catch (err) {
      console.error('Failed to load wildlife telemetry data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPark]);

  useEffect(() => {
    loadData();
    // Periodic poll every 30s
    const timer = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Handle alert triage from modal
  const handleAcknowledgeAlert = async (alertId: string, notes: string, rangers?: string[]) => {
    try {
      const updated = await wildlifeService.acknowledgeAlert(
        alertId,
        notes,
        userName,
        rangers
      );
      setAlerts((prev) => prev.map((a) => (a.alertId === alertId ? updated : a)));
      setSelectedAlertForModal(updated);
      loadData();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleResolveAlert = async (alertId: string, notes: string) => {
    try {
      const updated = await wildlifeService.resolveAlert(alertId, notes, userName);
      setAlerts((prev) => prev.map((a) => (a.alertId === alertId ? updated : a)));
      setSelectedAlertForModal(updated);
      loadData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Trigger live collar ping simulation
  const handleSimulatePing = async (collarId: string) => {
    try {
      const updatedAnimal = await wildlifeService.simulatePing(collarId);
      setAnimals((prev) =>
        prev.map((a) => (a.collarId === collarId ? updatedAnimal : a))
      );
    } catch (err) {
      console.error('Error simulating collar ping:', err);
    }
  };

  // Open modal for a specific alert
  const openAlertModal = (alert: WildlifeAlert) => {
    setSelectedAlertForModal(alert);
    const matchedAnimal = animals.find(
      (a) => a.collarId === alert.collarId || a.animalId === alert.animalId
    );
    setSelectedAnimalForModal(matchedAnimal || null);
  };

  // Focus animal on Live Map
  const handleSelectAnimalForMap = (animal: CollaredAnimal) => {
    setSelectedAnimalForModal(animal);
    setActiveTab('map');
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;

  return (
    <div className="wildlife-module-wrapper">
      {/* Top Header */}
      <div className="monitoring-header">
        <div className="monitoring-title-wrap">
          <span className="section-kicker">WILDLIFE CONSERVATION TELEMETRY</span>
          <h1>
            <Icon name="radar" size={26} />
            Park Manager Wildlife Operations Center
          </h1>
          <p>
            Real-time collared wildlife tracking, active geofence monitoring, and risk zone threat management.
          </p>
        </div>

        <div className="monitoring-controls">
          {/* Park Selector */}
          <div className="park-select-badge">
            <Icon name="pin" size={15} />
            <select
              value={selectedPark}
              onChange={(e) => setSelectedPark(e.target.value)}
              aria-label="Select National Park"
            >
              <option value="Yala National Park">Yala National Park (Block I & II)</option>
              <option value="Wilpattu National Park">Wilpattu National Park</option>
              <option value="Udawalawe National Park">Udawalawe National Park</option>
              <option value="Kumana National Park">Kumana Bird & Wildlife Reserve</option>
              <option value="Minneriya National Park">Minneriya National Park</option>
              <option value="Sinharaja Forest Reserve">Sinharaja Forest Reserve</option>
              <option value="All Parks">All National Parks (Combined)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="icon-button"
            onClick={loadData}
            title="Refresh Real-time Telemetry"
            aria-label="Refresh Telemetry"
            disabled={isLoading}
          >
            <Icon name="refresh" size={17} />
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="monitoring-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Icon name="grid" size={16} />
          <span>Monitoring Dashboard</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <Icon name="paw" size={16} />
          <span>Animal Tracking</span>
          <span className="tab-badge count">{animals.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Icon name="map" size={16} />
          <span>Live Map & Boundaries</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          <Icon name="shield" size={16} />
          <span>Risk Zones</span>
          <span className="tab-badge count">{zones.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Icon name="bell" size={16} />
          <span>Geofence Alerts</span>
          {activeAlertsCount > 0 ? (
            <span className="tab-badge danger">{activeAlertsCount}</span>
          ) : (
            <span className="tab-badge count">{alerts.length}</span>
          )}
        </button>
      </div>

      {/* Active View Container */}
      <div className="tab-view-content">
        {activeTab === 'dashboard' && (
          <MonitoringDashboard
            overview={overview}
            animals={animals}
            zones={zones}
            alerts={alerts}
            selectedPark={selectedPark}
            onChangeTab={setActiveTab}
            onSelectAnimal={(an) => {
              setSelectedAnimalForModal(an);
              setActiveTab('tracking');
            }}
            onSelectAlert={openAlertModal}
          />
        )}

        {activeTab === 'tracking' && (
          <AnimalTracking
            animals={animals}
            selectedPark={selectedPark}
            onSelectAnimalForMap={handleSelectAnimalForMap}
            onSimulatePing={handleSimulatePing}
          />
        )}

        {activeTab === 'map' && (
          <LiveMap
            animals={animals}
            zones={zones}
            alerts={alerts}
            selectedPark={selectedPark}
            onSelectAnimal={(an) => setSelectedAnimalForModal(an)}
            onSelectAlert={openAlertModal}
          />
        )}

        {activeTab === 'zones' && (
          <RiskZonesView
            zones={zones}
            animals={animals}
            selectedPark={selectedPark}
            onFocusZoneOnMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            selectedPark={selectedPark}
            onSelectAlert={openAlertModal}
            onAcknowledgeAlert={(alertId) => {
              const al = alerts.find((a) => a.alertId === alertId);
              if (al) openAlertModal(al);
            }}
          />
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlertForModal && (
        <AlertDetailsModal
          alert={selectedAlertForModal}
          animal={selectedAnimalForModal}
          onClose={() => setSelectedAlertForModal(null)}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
          onFocusOnMap={() => {
            setActiveTab('map');
          }}
        />
      )}
    </div>
  );
};
