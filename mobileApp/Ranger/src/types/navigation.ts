import { LocalIncidentRecord } from './incident';

export type RangerStackParamList = {
  RangerLogin: undefined;
  RangerMainTabs: undefined;
  LogIncident: undefined;
  IncidentSuccess: {
    incident: LocalIncidentRecord;
    isOnline: boolean;
  };
  IncidentDetails: {
    incidentId: string;
    incident?: LocalIncidentRecord;
  };
  SyncStatus: undefined;
};

export type RangerTabParamList = {
  HomeTab: undefined;
  IncidentsTab: undefined;
  AlertsTab: undefined;
};
