export const INCIDENT_TYPES = [
  'Snare Detected',
  'Animal Carcass',
  'Illegal Campsite',
  'Suspicious Footprints',
  'Poaching Evidence',
  'Injured Animal',
  'Other Wildlife Incident',
] as const;

export type IncidentType = typeof INCIDENT_TYPES[number];

export interface IncidentTypeMeta {
  type: IncidentType;
  label: string;
  icon: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export const INCIDENT_TYPE_METADATA: Record<IncidentType, IncidentTypeMeta> = {
  'Snare Detected': {
    type: 'Snare Detected',
    label: 'Snare Detected',
    icon: '🪤',
    severity: 'CRITICAL',
    description: 'Wire or rope snare set by poachers to trap wildlife.',
  },
  'Animal Carcass': {
    type: 'Animal Carcass',
    label: 'Animal Carcass',
    icon: '🦴',
    severity: 'HIGH',
    description: 'Remains of deceased wildlife requiring cause investigation.',
  },
  'Illegal Campsite': {
    type: 'Illegal Campsite',
    label: 'Illegal Campsite',
    icon: '⛺',
    severity: 'HIGH',
    description: 'Unauthorized human settlement or encampment inside reserve.',
  },
  'Suspicious Footprints': {
    type: 'Suspicious Footprints',
    label: 'Suspicious Footprints',
    icon: '👣',
    severity: 'MEDIUM',
    description: 'Fresh unauthorized boot prints or tyre tracks in restricted sectors.',
  },
  'Poaching Evidence': {
    type: 'Poaching Evidence',
    label: 'Poaching Evidence',
    icon: '🎯',
    severity: 'CRITICAL',
    description: 'Spent bullet casings, hunting gear, or tree hideouts discovered.',
  },
  'Injured Animal': {
    type: 'Injured Animal',
    label: 'Injured Animal',
    icon: '🩹',
    severity: 'HIGH',
    description: 'Living animal trapped, shot, or suffering injuries needing vet care.',
  },
  'Other Wildlife Incident': {
    type: 'Other Wildlife Incident',
    label: 'Other Wildlife Incident',
    icon: '📋',
    severity: 'LOW',
    description: 'General ecological disturbance, fence damage, or unusual hazard.',
  },
};
