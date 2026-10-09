import { api } from './api';
import type {
  CollaredAnimal,
  RiskZone,
  WildlifeAlert,
  MonitoringOverview,
} from '../types/wildlife';

// Initial fallback datasets for instant rendering / offline tolerance
const FALLBACK_ZONES: RiskZone[] = [
  {
    zoneId: 'ZONE-YALA-01',
    name: 'Menik River South Poaching Buffer',
    park: 'Yala National Park',
    riskLevel: 'High Risk',
    hazardType: 'Poaching Hotspot',
    description: 'Dense scrubland corridor along the riverbank historically vulnerable to illegal snares and unauthorized vehicle access.',
    areaKm2: 18.4,
    alertTriggerThresholdMeters: 150,
    recommendedSOP: 'Immediate drone reconnaissance and dispatch Sector Charlie rapid response patrol unit.',
    activeAnimalCount: 1,
    coordinates: [
      { latitude: 6.368, longitude: 81.512 },
      { latitude: 6.395, longitude: 81.545 },
      { latitude: 6.375, longitude: 81.575 },
      { latitude: 6.345, longitude: 81.542 },
    ],
  },
  {
    zoneId: 'ZONE-YALA-02',
    name: 'Kataragama Boundary Agricultural Buffer',
    park: 'Yala National Park',
    riskLevel: 'High Risk',
    hazardType: 'Human Settlement Buffer',
    description: 'Active agricultural frontier with high human-elephant conflict probability and vulnerable village crops.',
    areaKm2: 24.1,
    alertTriggerThresholdMeters: 250,
    recommendedSOP: 'Activate boundary warning sirens, notify community wildlife warden, and guide animal back toward park interior.',
    activeAnimalCount: 1,
    coordinates: [
      { latitude: 6.425, longitude: 81.332 },
      { latitude: 6.458, longitude: 81.365 },
      { latitude: 6.442, longitude: 81.412 },
      { latitude: 6.402, longitude: 81.385 },
    ],
  },
  {
    zoneId: 'ZONE-YALA-03',
    name: 'Palatupana Coastal Dunes Corridor',
    park: 'Yala National Park',
    riskLevel: 'Moderate Warning',
    hazardType: 'Highway Traffic Hazard',
    description: 'Coastal eco-zone intersecting park access roads with frequent tourist safari vehicle density.',
    areaKm2: 14.8,
    alertTriggerThresholdMeters: 200,
    recommendedSOP: 'Enforce speed limits on coastal track, assign road warden to guide crossing megafauna.',
    activeAnimalCount: 1,
    coordinates: [
      { latitude: 6.265, longitude: 81.442 },
      { latitude: 6.292, longitude: 81.485 },
      { latitude: 6.275, longitude: 81.522 },
      { latitude: 6.242, longitude: 81.475 },
    ],
  },
  {
    zoneId: 'ZONE-YALA-04',
    name: 'Block I Core Nature Reserve',
    park: 'Yala National Park',
    riskLevel: 'Safe',
    hazardType: 'Core Protected Sanctuary',
    description: 'Pristine primary habitat with rich waterholes, granite rock outcrops, and optimal prey density.',
    areaKm2: 86.5,
    alertTriggerThresholdMeters: 50,
    recommendedSOP: 'Standard routine monitoring and periodic waterhole camera trap maintenance.',
    activeAnimalCount: 4,
    coordinates: [
      { latitude: 6.315, longitude: 81.425 },
      { latitude: 6.385, longitude: 81.445 },
      { latitude: 6.365, longitude: 81.515 },
      { latitude: 6.295, longitude: 81.495 },
    ],
  },
];

const FALLBACK_ANIMALS: CollaredAnimal[] = [
  {
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    name: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    sex: 'Male',
    ageYears: 32,
    weightKg: 4250,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.372,
      longitude: 81.528,
      altitude: 42,
      timestamp: new Date().toISOString(),
      speedKmh: 4.8,
      heading: 142,
    },
    locationHistory: [
      { latitude: 6.355, longitude: 81.498, timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), speedKmh: 3.2, heading: 110 },
      { latitude: 6.361, longitude: 81.512, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 3.9, heading: 125 },
      { latitude: 6.372, longitude: 81.528, timestamp: new Date().toISOString(), speedKmh: 4.8, heading: 142 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-YALA-01',
    currentZoneName: 'Menik River South Poaching Buffer',
    isInHighRiskZone: true,
    batteryLevel: 91,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    collarModel: 'EcoTrack V4 Ultra-VHF/GPS',
    notes: 'Dominant bull elephant. Frequently wanders near the southern boundary river crossings during drought seasons.',
  },
  {
    collarId: 'COL-LEO-019',
    animalId: 'LEO-019',
    name: 'Kalu (Shadow)',
    species: 'Sri Lankan Leopard',
    sex: 'Male',
    ageYears: 7,
    weightKg: 78,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.335,
      longitude: 81.468,
      altitude: 68,
      timestamp: new Date().toISOString(),
      speedKmh: 1.4,
      heading: 210,
    },
    locationHistory: [
      { latitude: 6.328, longitude: 81.455, timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), speedKmh: 2.1, heading: 195 },
      { latitude: 6.331, longitude: 81.462, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 0.8, heading: 205 },
      { latitude: 6.335, longitude: 81.468, timestamp: new Date().toISOString(), speedKmh: 1.4, heading: 210 },
    ],
    status: 'Safe',
    currentZoneId: 'ZONE-YALA-04',
    currentZoneName: 'Block I Core Nature Reserve',
    isInHighRiskZone: false,
    batteryLevel: 84,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    collarModel: 'EcoTrack V4 Light-Collar',
    notes: 'Healthy apex predator inhabiting Kotaselimbe rocks. Active hunting patterns observed near waterholes.',
  },
  {
    collarId: 'COL-BEAR-005',
    animalId: 'BEAR-005',
    name: 'Wana (Paluwandura)',
    species: 'Sloth Bear',
    sex: 'Female',
    ageYears: 9,
    weightKg: 105,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.431,
      longitude: 81.352,
      altitude: 54,
      timestamp: new Date().toISOString(),
      speedKmh: 2.2,
      heading: 85,
    },
    locationHistory: [
      { latitude: 6.418, longitude: 81.339, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), speedKmh: 1.6, heading: 70 },
      { latitude: 6.425, longitude: 81.345, timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), speedKmh: 2.0, heading: 80 },
      { latitude: 6.431, longitude: 81.352, timestamp: new Date().toISOString(), speedKmh: 2.2, heading: 85 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-YALA-02',
    currentZoneName: 'Kataragama Boundary Agricultural Buffer',
    isInHighRiskZone: true,
    batteryLevel: 72,
    signalStrength: 'Moderate',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    collarModel: 'EcoTrack Rugged-Bear VHF',
    notes: 'Mother with two cubs foraging near boundary fruit groves. High risk of human encounter.',
  },
  {
    collarId: 'COL-ELE-102',
    animalId: 'ELE-102',
    name: 'Rani (Matriarch)',
    species: 'Asian Elephant',
    sex: 'Female',
    ageYears: 44,
    weightKg: 3890,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.348,
      longitude: 81.458,
      altitude: 38,
      timestamp: new Date().toISOString(),
      speedKmh: 2.8,
      heading: 320,
    },
    locationHistory: [
      { latitude: 6.335, longitude: 81.442, timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), speedKmh: 2.5, heading: 310 },
      { latitude: 6.342, longitude: 81.450, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 3.1, heading: 318 },
      { latitude: 6.348, longitude: 81.458, timestamp: new Date().toISOString(), speedKmh: 2.8, heading: 320 },
    ],
    status: 'Safe',
    currentZoneId: 'ZONE-YALA-04',
    currentZoneName: 'Block I Core Nature Reserve',
    isInHighRiskZone: false,
    batteryLevel: 96,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    collarModel: 'EcoTrack V4 Ultra-VHF/GPS',
    notes: 'Leads a herd of 14 elephants. Staying within the central water catchment basin.',
  },
  {
    collarId: 'COL-LEO-031',
    animalId: 'LEO-031',
    name: 'Chitra (Flora)',
    species: 'Sri Lankan Leopard',
    sex: 'Female',
    ageYears: 5,
    weightKg: 52,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.278,
      longitude: 81.472,
      altitude: 22,
      timestamp: new Date().toISOString(),
      speedKmh: 3.5,
      heading: 165,
    },
    locationHistory: [
      { latitude: 6.295, longitude: 81.465, timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), speedKmh: 2.8, heading: 155 },
      { latitude: 6.284, longitude: 81.468, timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), speedKmh: 3.2, heading: 160 },
      { latitude: 6.278, longitude: 81.472, timestamp: new Date().toISOString(), speedKmh: 3.5, heading: 165 },
    ],
    status: 'Warning',
    currentZoneId: 'ZONE-YALA-03',
    currentZoneName: 'Palatupana Coastal Dunes Corridor',
    isInHighRiskZone: false,
    batteryLevel: 68,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    collarModel: 'EcoTrack V4 Light-Collar',
    notes: 'Young female patrolling coastal sand scrub. Approaching secondary tourist safari track.',
  },
  {
    collarId: 'COL-DEER-042',
    animalId: 'DEER-042',
    name: 'Prancer (Herd Lead)',
    species: 'Spotted Deer',
    sex: 'Male',
    ageYears: 4,
    weightKg: 64,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.321,
      longitude: 81.482,
      altitude: 29,
      timestamp: new Date().toISOString(),
      speedKmh: 0.5,
      heading: 45,
    },
    locationHistory: [
      { latitude: 6.315, longitude: 81.479, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 0.7, heading: 40 },
      { latitude: 6.321, longitude: 81.482, timestamp: new Date().toISOString(), speedKmh: 0.5, heading: 45 },
    ],
    status: 'Safe',
    currentZoneId: 'ZONE-YALA-04',
    currentZoneName: 'Block I Core Nature Reserve',
    isInHighRiskZone: false,
    batteryLevel: 42,
    signalStrength: 'Moderate',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    collarModel: 'EcoTrack Solar Mini-Tag',
    notes: 'Grazing in open grassland with herd of 40+ deer. Battery level low due to canopy shade.',
  },
  {
    collarId: 'COL-CROC-011',
    animalId: 'CROC-011',
    name: 'Kumbhira',
    species: 'Mugger Crocodile',
    sex: 'Male',
    ageYears: 22,
    weightKg: 340,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.352,
      longitude: 81.442,
      altitude: 18,
      timestamp: new Date().toISOString(),
      speedKmh: 0.2,
      heading: 10,
    },
    locationHistory: [
      { latitude: 6.350, longitude: 81.440, timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), speedKmh: 0.1, heading: 5 },
      { latitude: 6.352, longitude: 81.442, timestamp: new Date().toISOString(), speedKmh: 0.2, heading: 10 },
    ],
    status: 'Safe',
    currentZoneId: 'ZONE-YALA-04',
    currentZoneName: 'Block I Core Nature Reserve',
    isInHighRiskZone: false,
    batteryLevel: 18,
    signalStrength: 'Weak',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    collarModel: 'EcoTrack Hydro-Tag Acoustic/GPS',
    notes: 'Basking on Buthawa tank mudbank. Signal degraded & battery critical (18%) due to extended underwater submersion.',
  },
  {
    collarId: 'COL-BOAR-014',
    animalId: 'BOAR-014',
    name: 'Bora (Alpha Boar)',
    species: 'Wild Boar',
    sex: 'Male',
    ageYears: 5,
    weightKg: 130,
    park: 'Wilpattu National Park',
    currentLocation: {
      latitude: 8.438,
      longitude: 79.948,
      altitude: 19,
      timestamp: new Date().toISOString(),
      speedKmh: 4.1,
      heading: 115,
    },
    locationHistory: [
      { latitude: 8.428, longitude: 79.932, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 3.8, heading: 110 },
      { latitude: 8.438, longitude: 79.948, timestamp: new Date().toISOString(), speedKmh: 4.1, heading: 115 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-WILP-01',
    currentZoneName: 'Kala Oya Estuary High-Risk Frontier',
    isInHighRiskZone: true,
    batteryLevel: 34,
    signalStrength: 'Moderate',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    collarModel: 'EcoTrack Solar Mini-Tag',
    notes: 'Sounder alpha leading herd into unauthorized village agricultural fringe. Collar solar lens mud-caked (34% battery).',
  },
  {
    collarId: 'COL-BUFF-022',
    animalId: 'BUFF-022',
    name: 'Mahasen',
    species: 'Water Buffalo',
    sex: 'Male',
    ageYears: 11,
    weightKg: 620,
    park: 'Udawalawe National Park',
    currentLocation: {
      latitude: 6.468,
      longitude: 80.885,
      altitude: 65,
      timestamp: new Date().toISOString(),
      speedKmh: 3.4,
      heading: 205,
    },
    locationHistory: [
      { latitude: 6.478, longitude: 80.895, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), speedKmh: 2.9, heading: 195 },
      { latitude: 6.468, longitude: 80.885, timestamp: new Date().toISOString(), speedKmh: 3.4, heading: 205 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-UDAW-01',
    currentZoneName: 'Southern Highway Elephant Corridor',
    isInHighRiskZone: true,
    batteryLevel: 76,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    collarModel: 'EcoTrack Heavy V4-VHF',
    notes: 'Dominant bull leading herd of 18 water buffalo across highway buffer fence into unauthorized road reserve.',
  },
  {
    collarId: 'COL-ELE-201',
    animalId: 'ELE-201',
    name: 'Wilba (Tuskless)',
    species: 'Asian Elephant',
    sex: 'Male',
    ageYears: 28,
    weightKg: 3950,
    park: 'Wilpattu National Park',
    currentLocation: {
      latitude: 8.425,
      longitude: 79.912,
      altitude: 15,
      timestamp: new Date().toISOString(),
      speedKmh: 5.1,
      heading: 280,
    },
    locationHistory: [
      { latitude: 8.410, longitude: 79.935, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), speedKmh: 4.2, heading: 270 },
      { latitude: 8.425, longitude: 79.912, timestamp: new Date().toISOString(), speedKmh: 5.1, heading: 280 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-WILP-01',
    currentZoneName: 'Kala Oya Estuary High-Risk Frontier',
    isInHighRiskZone: true,
    batteryLevel: 94,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    collarModel: 'EcoTrack V4 Ultra-VHF/GPS',
    notes: 'Approaching mangrove border near shrimp farming settlements.',
  },
  {
    collarId: 'COL-ELE-301',
    animalId: 'ELE-301',
    name: 'Walawe Raja',
    species: 'Asian Elephant',
    sex: 'Male',
    ageYears: 36,
    weightKg: 4600,
    park: 'Udawalawe National Park',
    currentLocation: {
      latitude: 6.472,
      longitude: 80.872,
      altitude: 72,
      timestamp: new Date().toISOString(),
      speedKmh: 6.4,
      heading: 190,
    },
    locationHistory: [
      { latitude: 6.488, longitude: 80.865, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), speedKmh: 5.8, heading: 185 },
      { latitude: 6.472, longitude: 80.872, timestamp: new Date().toISOString(), speedKmh: 6.4, heading: 190 },
    ],
    status: 'High Risk',
    currentZoneId: 'ZONE-UDAW-01',
    currentZoneName: 'Southern Highway Elephant Corridor',
    isInHighRiskZone: true,
    batteryLevel: 89,
    signalStrength: 'Strong',
    lastPingAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    collarModel: 'EcoTrack V4 Ultra-VHF/GPS',
    notes: 'Rapid heading towards expressway underpass. High velocity movement.',
  },
];

const FALLBACK_ALERTS: WildlifeAlert[] = [
  {
    alertId: 'ALT-2026-0941',
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    animalName: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-01',
    zoneName: 'Menik River South Poaching Buffer',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Collared Elephant breached boundary geofence into Menik River South Poaching Buffer sector.',
    location: {
      latitude: 6.372,
      longitude: 81.528,
      sector: 'Sector C - Riverfront',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0938',
    collarId: 'COL-BEAR-005',
    animalId: 'BEAR-005',
    animalName: 'Wana (Paluwandura)',
    species: 'Sloth Bear',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-02',
    zoneName: 'Kataragama Boundary Agricultural Buffer',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Female Sloth Bear with cubs detected within 120m of village boundary fruit orchards.',
    location: {
      latitude: 6.431,
      longitude: 81.352,
      sector: 'Sector K - Kataragama North',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0932',
    collarId: 'COL-LEO-031',
    animalId: 'LEO-031',
    animalName: 'Chitra (Flora)',
    species: 'Sri Lankan Leopard',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-03',
    zoneName: 'Palatupana Coastal Dunes Corridor',
    severity: 'Warning',
    status: 'Acknowledged',
    triggerReason: 'Leopard movement detected across tourist safari route during heavy transit window.',
    location: {
      latitude: 6.278,
      longitude: 81.472,
      sector: 'Sector P - Palatupana Dunes',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    acknowledgedBy: 'Nisal Dushmantha (Park Manager)',
    managerNotes: 'Temporary speed restriction issued to Palatupana gate rangers. Safari jeeps advised to keep 50m distance.',
    dispatchedRangers: ['Ranger Sunil (Team Bravo)', 'Ranger Bandara (Mobile 4)'],
  },
  {
    alertId: 'ALT-2026-0925',
    collarId: 'COL-ELE-301',
    animalId: 'ELE-301',
    animalName: 'Walawe Raja',
    species: 'Asian Elephant',
    park: 'Udawalawe National Park',
    zoneId: 'ZONE-UDAW-01',
    zoneName: 'Southern Highway Elephant Corridor',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Bull elephant moving at 6.4 km/h towards unprotected highway perimeter corridor.',
    location: {
      latitude: 6.472,
      longitude: 80.872,
      sector: 'Corridor 2 - Highway Transit',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0951',
    collarId: 'COL-ELE-201',
    animalId: 'ELE-201',
    animalName: 'Wilba (Tuskless)',
    species: 'Asian Elephant',
    park: 'Wilpattu National Park',
    zoneId: 'ZONE-WILP-01',
    zoneName: 'Kala Oya Estuary High-Risk Frontier',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Unauthorized boundary entry: Collared Bull Elephant crossed boundary fence into private shrimp aquaculture settlement.',
    location: {
      latitude: 8.425,
      longitude: 79.912,
      sector: 'Sector M - Kala Oya Mangroves',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0952',
    collarId: 'COL-BUFF-022',
    animalId: 'BUFF-022',
    animalName: 'Mahasen',
    species: 'Water Buffalo',
    park: 'Udawalawe National Park',
    zoneId: 'ZONE-UDAW-01',
    zoneName: 'Southern Highway Elephant Corridor',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Unauthorized highway corridor entry: Water Buffalo herd broke through perimeter fence into restricted road reserve.',
    location: {
      latitude: 6.468,
      longitude: 80.885,
      sector: 'Corridor 3 - Highway Reserve',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0953',
    collarId: 'COL-BOAR-014',
    animalId: 'BOAR-014',
    animalName: 'Bora (Alpha Boar)',
    species: 'Wild Boar',
    park: 'Wilpattu National Park',
    zoneId: 'ZONE-WILP-01',
    zoneName: 'Kala Oya Estuary High-Risk Frontier',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'Unauthorized perimeter entry: Sounder of wild boars crossed park boundary into private paddy farming plots.',
    location: {
      latitude: 8.438,
      longitude: 79.948,
      sector: 'Sector V - Village Buffer',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0947',
    collarId: 'COL-CROC-011',
    animalId: 'CROC-011',
    animalName: 'Kumbhira',
    species: 'Mugger Crocodile',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Collar battery level critical (18% remaining). Prolonged underwater submersion preventing solar recharging; immediate battery module swap required.',
    location: {
      latitude: 6.352,
      longitude: 81.442,
      sector: 'Sector B - Buthawa Tank',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0948',
    collarId: 'COL-BOAR-014',
    animalId: 'BOAR-014',
    animalName: 'Bora (Alpha Boar)',
    species: 'Wild Boar',
    park: 'Wilpattu National Park',
    zoneId: 'ZONE-WILP-01',
    zoneName: 'Kala Oya Estuary High-Risk Frontier',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'Collar battery level low (34% remaining). Solar harvesting panel mud-caked during root foraging; ranger inspection scheduled.',
    location: {
      latitude: 8.438,
      longitude: 79.948,
      sector: 'Sector V - Village Buffer',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0945',
    collarId: 'COL-DEER-142',
    animalId: 'DEER-142',
    animalName: 'Nelli',
    species: 'Spotted Deer',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'Collar battery level critical/low (42% remaining). Solar panel recharging degraded under dense forest canopy; maintenance dispatch required.',
    location: {
      latitude: 6.322,
      longitude: 81.442,
      sector: 'Sector A - Main Grasslands',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0961',
    collarId: 'COL-LEO-019',
    animalId: 'LEO-019',
    animalName: 'Kalu (Shadow)',
    species: 'Sri Lankan Leopard',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Critical Collar Battery (14% remaining). Solar harvesting module damaged after territorial leopard fight; emergency collar retrieval/replacement required.',
    location: {
      latitude: 6.335,
      longitude: 81.468,
      sector: 'Sector K - Kotaselimbe Rocks',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0962',
    collarId: 'COL-ELE-301',
    animalId: 'ELE-301',
    animalName: 'Walawe Raja',
    species: 'Asian Elephant',
    park: 'Udawalawe National Park',
    zoneId: 'ZONE-UDAW-01',
    zoneName: 'Southern Highway Elephant Corridor',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'Collar battery level low (28% remaining). Telemetry ping frequency automatically throttled to reserve remaining power; battery service dispatched.',
    location: {
      latitude: 6.472,
      longitude: 80.872,
      sector: 'Corridor 2 - Highway Transit',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0963',
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    animalName: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-02',
    zoneName: 'Kataragama Boundary Agricultural Buffer',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Unauthorized area entry: Collared tusker breached boundary electric fence and entered civilian sugarcane plantations.',
    location: {
      latitude: 6.418,
      longitude: 81.339,
      sector: 'Sector K - Kataragama South Farmlands',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0964',
    collarId: 'COL-LEO-031',
    animalId: 'LEO-031',
    animalName: 'Chitra (Flora)',
    species: 'Sri Lankan Leopard',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-03',
    zoneName: 'Palatupana Coastal Dunes Corridor',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Unauthorized perimeter entry: Leopard detected within 40m of main tourist access road & park ticketing toll gate.',
    location: {
      latitude: 6.265,
      longitude: 81.442,
      sector: 'Sector P - Palatupana Entrance Corridor',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    managerNotes: '',
    dispatchedRangers: [],
  },
  {
    alertId: 'ALT-2026-0919',
    collarId: 'COL-ELE-102',
    animalId: 'ELE-102',
    animalName: 'Rani (Matriarch)',
    species: 'Asian Elephant',
    park: 'Yala National Park',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    severity: 'Info',
    status: 'Resolved',
    triggerReason: 'Herd safely transited back into core sanctuary after seasonal watering stop.',
    location: {
      latitude: 6.348,
      longitude: 81.458,
      sector: 'Sector B - Buthawa Plain',
    },
    triggeredAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    acknowledgedBy: 'Nisal Dushmantha (Park Manager)',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolvedBy: 'Nisal Dushmantha (Park Manager)',
    managerNotes: 'Monitoring team confirmed 14 elephants inside core sanctuary.',
    resolutionNotes: 'No further risk detected. Herd settled near main watering reservoir.',
  },
];

export const wildlifeService = {
  getOverview: async (park?: string): Promise<MonitoringOverview> => {
    try {
      const q = park && park !== 'All Parks' ? `?park=${encodeURIComponent(park)}` : '';
      const res = await api.get<{ success: boolean; data: MonitoringOverview }>(`/monitoring/overview${q}`);
      if (res.data) return res.data;
    } catch {}

    // Fallback calculation
    const animals = FALLBACK_ANIMALS.filter((a) => !park || park === 'All Parks' || a.park === park);
    const zones = FALLBACK_ZONES.filter((z) => !park || park === 'All Parks' || z.park === park);
    const alerts = FALLBACK_ALERTS.filter((al) => !park || park === 'All Parks' || al.park === park);

    const speciesMap: Record<string, number> = {};
    animals.forEach((a) => {
      speciesMap[a.species] = (speciesMap[a.species] || 0) + 1;
    });

    return {
      park: park || 'All Parks',
      totalCollared: animals.length,
      animalsInHighRisk: animals.filter((a) => a.status === 'High Risk' || a.isInHighRiskZone).length,
      animalsSafe: animals.filter((a) => a.status === 'Safe').length,
      animalsWarning: animals.filter((a) => a.status === 'Warning').length,
      lowBatteryCollars: animals.filter((a) => a.batteryLevel < 50).length,
      activeAlertsCount: alerts.filter((al) => al.status === 'Active').length,
      acknowledgedAlertsCount: alerts.filter((al) => al.status === 'Acknowledged').length,
      resolvedAlertsCount: alerts.filter((al) => al.status === 'Resolved').length,
      speciesBreakdown: speciesMap,
      zonesCount: zones.length,
      highRiskZonesCount: zones.filter((z) => z.riskLevel === 'High Risk').length,
      normalZonesCount: zones.filter((z) => z.riskLevel !== 'High Risk').length,
      recentUpdates: alerts.slice(0, 5).map((al) => ({
        id: al.alertId,
        time: al.triggeredAt,
        type: al.severity,
        title: `${al.animalName} (${al.species})`,
        message: al.triggerReason,
        zone: al.zoneName,
        status: al.status,
      })),
      lastTelemetrySync: new Date().toISOString(),
    };
  },

  getAnimals: async (query?: {
    park?: string;
    species?: string;
    status?: string;
    search?: string;
  }): Promise<CollaredAnimal[]> => {
    try {
      const params = new URLSearchParams();
      if (query?.park && query.park !== 'All Parks') params.append('park', query.park);
      if (query?.species && query.species !== 'All Species') params.append('species', query.species);
      if (query?.status && query.status !== 'All Status') params.append('status', query.status);
      if (query?.search) params.append('search', query.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ success: boolean; data: CollaredAnimal[] }>(`/monitoring/animals${qs}`);
      if (res.data) return res.data;
    } catch {}

    let filtered = [...FALLBACK_ANIMALS];
    if (query?.park && query.park !== 'All Parks') {
      filtered = filtered.filter((a) => a.park === query.park);
    }
    if (query?.species && query.species !== 'All Species') {
      filtered = filtered.filter((a) => a.species === query.species);
    }
    if (query?.status && query.status !== 'All Status') {
      filtered = filtered.filter((a) => a.status === query.status);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.animalId.toLowerCase().includes(s) ||
          a.collarId.toLowerCase().includes(s)
      );
    }
    return filtered;
  },

  getAnimalById: async (id: string): Promise<CollaredAnimal | null> => {
    try {
      const res = await api.get<{ success: boolean; data: CollaredAnimal }>(`/monitoring/animals/${id}`);
      if (res.data) return res.data;
    } catch {}

    return FALLBACK_ANIMALS.find((a) => a.collarId === id || a.animalId === id) || null;
  },

  getZones: async (park?: string): Promise<RiskZone[]> => {
    try {
      const q = park && park !== 'All Parks' ? `?park=${encodeURIComponent(park)}` : '';
      const res = await api.get<{ success: boolean; data: RiskZone[] }>(`/monitoring/zones${q}`);
      if (res.data) return res.data;
    } catch {}

    return FALLBACK_ZONES.filter((z) => !park || park === 'All Parks' || z.park === park);
  },

  getAlerts: async (query?: {
    park?: string;
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<WildlifeAlert[]> => {
    try {
      const params = new URLSearchParams();
      if (query?.park && query.park !== 'All Parks') params.append('park', query.park);
      if (query?.status && query.status !== 'All') params.append('status', query.status);
      if (query?.severity && query.severity !== 'All') params.append('severity', query.severity);
      if (query?.search) params.append('search', query.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ success: boolean; data: WildlifeAlert[] }>(`/monitoring/alerts${qs}`);
      if (res.data) return res.data;
    } catch {}

    let filtered = [...FALLBACK_ALERTS];
    if (query?.park && query.park !== 'All Parks') {
      filtered = filtered.filter((al) => al.park === query.park);
    }
    if (query?.status && query.status !== 'All') {
      filtered = filtered.filter((al) => al.status === query.status);
    }
    if (query?.severity && query.severity !== 'All') {
      filtered = filtered.filter((al) => al.severity === query.severity);
    }
    if (query?.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (al) =>
          al.alertId.toLowerCase().includes(s) ||
          al.animalName.toLowerCase().includes(s) ||
          al.zoneName.toLowerCase().includes(s)
      );
    }
    return filtered;
  },

  getAlertById: async (alertId: string): Promise<WildlifeAlert | null> => {
    try {
      const res = await api.get<{ success: boolean; data: WildlifeAlert }>(`/monitoring/alerts/${alertId}`);
      if (res.data) return res.data;
    } catch {}

    return FALLBACK_ALERTS.find((al) => al.alertId === alertId) || null;
  },

  acknowledgeAlert: async (
    alertId: string,
    managerNotes?: string,
    managerName?: string,
    dispatchedRangers?: string[]
  ): Promise<WildlifeAlert> => {
    try {
      const res = await api.post<{ success: boolean; data: WildlifeAlert }>(
        `/monitoring/alerts/${alertId}/acknowledge`,
        { managerNotes, managerName, dispatchedRangers }
      );
      if (res.data) return res.data;
    } catch {}

    const idx = FALLBACK_ALERTS.findIndex((al) => al.alertId === alertId);
    if (idx !== -1) {
      FALLBACK_ALERTS[idx] = {
        ...FALLBACK_ALERTS[idx],
        status: 'Acknowledged',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: managerName || 'Park Manager',
        managerNotes: managerNotes || 'Acknowledged by Park Manager',
        dispatchedRangers: dispatchedRangers || ['Ranger Patrol Alpha'],
      };
      return FALLBACK_ALERTS[idx];
    }
    throw new Error('Alert not found');
  },

  resolveAlert: async (
    alertId: string,
    resolutionNotes?: string,
    managerName?: string
  ): Promise<WildlifeAlert> => {
    try {
      const res = await api.post<{ success: boolean; data: WildlifeAlert }>(
        `/monitoring/alerts/${alertId}/resolve`,
        { resolutionNotes, managerName }
      );
      if (res.data) return res.data;
    } catch {}

    const idx = FALLBACK_ALERTS.findIndex((al) => al.alertId === alertId);
    if (idx !== -1) {
      FALLBACK_ALERTS[idx] = {
        ...FALLBACK_ALERTS[idx],
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: managerName || 'Park Manager',
        resolutionNotes: resolutionNotes || 'Animal monitored and confirmed in safe habitat.',
      };
      return FALLBACK_ALERTS[idx];
    }
    throw new Error('Alert not found');
  },

  simulatePing: async (collarId: string): Promise<CollaredAnimal> => {
    try {
      const res = await api.post<{ success: boolean; data: CollaredAnimal }>(
        '/monitoring/simulate-ping',
        { collarId }
      );
      if (res.data) return res.data;
    } catch {}

    const animal = FALLBACK_ANIMALS.find((a) => a.collarId === collarId);
    if (animal) {
      const deltaLat = (Math.random() - 0.5) * 0.003;
      const deltaLng = (Math.random() - 0.5) * 0.003;
      animal.currentLocation.latitude += deltaLat;
      animal.currentLocation.longitude += deltaLng;
      animal.currentLocation.timestamp = new Date().toISOString();
      animal.lastPingAt = new Date().toISOString();
      return { ...animal };
    }
    throw new Error('Animal not found');
  },
};
