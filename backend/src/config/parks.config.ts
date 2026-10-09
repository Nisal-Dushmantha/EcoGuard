export interface ParkLocation {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface ParkConfig {
  id: string;
  name: string;
  code: string;
  province: string;
  totalAreaSqKm: number;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  locations: ParkLocation[];
}

export const PARKS_CONFIG: ParkConfig[] = [
  {
    id: 'yala',
    name: 'Yala National Park',
    code: 'YNP',
    province: 'Southern / Uva Province',
    totalAreaSqKm: 979,
    centerCoordinates: {
      latitude: 6.3687,
      longitude: 81.5204,
    },
    locations: [
      {
        id: 'yala-all',
        name: 'All Areas',
        code: 'ALL',
        latitude: 6.3687,
        longitude: 81.5204,
      },
      {
        id: 'yala-b1',
        name: 'Block 1 - Palatupana Sector',
        code: 'BLK-1',
        latitude: 6.2755,
        longitude: 81.4284,
      },
      {
        id: 'yala-b2',
        name: 'Block 2 - Menik River Corridor',
        code: 'BLK-2',
        latitude: 6.3812,
        longitude: 81.4921,
      },
      {
        id: 'yala-katagamuwa',
        name: 'Katagamuwa Sanctuary Border',
        code: 'KAT',
        latitude: 6.4251,
        longitude: 81.3892,
      },
      {
        id: 'yala-lunugamvehera',
        name: 'Lunugamvehera Corridor',
        code: 'LUN',
        latitude: 6.4103,
        longitude: 81.2584,
      },
      {
        id: 'yala-sithulpawwa',
        name: 'Sithulpawwa Buffer Zone',
        code: 'SIT',
        latitude: 6.3521,
        longitude: 81.4395,
      },
    ],
  },
  {
    id: 'wilpattu',
    name: 'Wilpattu National Park',
    code: 'WNP',
    province: 'North Western / North Central',
    totalAreaSqKm: 1317,
    centerCoordinates: {
      latitude: 8.4552,
      longitude: 80.0381,
    },
    locations: [
      {
        id: 'wilpattu-all',
        name: 'All Areas',
        code: 'ALL',
        latitude: 8.4552,
        longitude: 80.0381,
      },
      {
        id: 'wilpattu-maradan',
        name: 'Maradanmaduwa Sector',
        code: 'MRD',
        latitude: 8.4114,
        longitude: 80.1123,
      },
      {
        id: 'wilpattu-kali',
        name: 'Kali Villu Sector',
        code: 'KAL',
        latitude: 8.5291,
        longitude: 80.0142,
      },
      {
        id: 'wilpattu-entrance',
        name: 'Hunuwilagama Entrance Beat',
        code: 'HUN',
        latitude: 8.3182,
        longitude: 80.1541,
      },
      {
        id: 'wilpattu-pomparippu',
        name: 'Pomparippu Coastal Basin',
        code: 'POM',
        latitude: 8.3582,
        longitude: 79.8821,
      },
    ],
  },
  {
    id: 'udawalawe',
    name: 'Udawalawe National Park',
    code: 'UNP',
    province: 'Sabaragamuwa / Uva',
    totalAreaSqKm: 308,
    centerCoordinates: {
      latitude: 6.4745,
      longitude: 80.8987,
    },
    locations: [
      {
        id: 'udawalawe-all',
        name: 'All Areas',
        code: 'ALL',
        latitude: 6.4745,
        longitude: 80.8987,
      },
      {
        id: 'udawalawe-reservoir',
        name: 'Reservoir Perimeter',
        code: 'RES',
        latitude: 6.4621,
        longitude: 80.8841,
      },
      {
        id: 'udawalawe-veheragala',
        name: 'Veheragala Boundary',
        code: 'VEH',
        latitude: 6.4912,
        longitude: 80.9312,
      },
      {
        id: 'udawalawe-mauara',
        name: 'Mau Ara Southern Beat',
        code: 'MAU',
        latitude: 6.4352,
        longitude: 80.8712,
      },
    ],
  },
  {
    id: 'minneriya',
    name: 'Minneriya National Park',
    code: 'MNP',
    province: 'North Central',
    totalAreaSqKm: 88,
    centerCoordinates: {
      latitude: 8.0333,
      longitude: 80.8833,
    },
    locations: [
      {
        id: 'minneriya-all',
        name: 'All Areas',
        code: 'ALL',
        latitude: 8.0333,
        longitude: 80.8833,
      },
      {
        id: 'minneriya-tank',
        name: 'Minneriya Tank Grassland',
        code: 'TNK',
        latitude: 8.0289,
        longitude: 80.8951,
      },
      {
        id: 'minneriya-habarana',
        name: 'Habarana Forest Corridor',
        code: 'HAB',
        latitude: 8.0512,
        longitude: 80.8421,
      },
      {
        id: 'minneriya-moragaswewa',
        name: 'Moragaswewa Boundary',
        code: 'MOR',
        latitude: 8.0121,
        longitude: 80.8712,
      },
    ],
  },
];
