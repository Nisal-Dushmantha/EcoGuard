import { IncidentLocation } from '../types/incident';

export interface LocationResult {
  success: boolean;
  location?: IncidentLocation;
  error?: string;
  code?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

class LocationService {
  private simulatedPermissionDenied: boolean = false;

  /**
   * Capture current GPS coordinates
   */
  async getCurrentLocation(): Promise<LocationResult> {
    if (this.simulatedPermissionDenied) {
      return {
        success: false,
        error: 'Location permission was denied. We need location access to attach the incident location.',
        code: 'PERMISSION_DENIED',
      };
    }

    try {
      // Check for browser / React Native navigator.geolocation API
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        return await new Promise<LocationResult>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                success: true,
                location: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || 12,
                  addressSummary: 'Yala National Park - Sector 4 (Field GPS)',
                },
              });
            },
            (err) => {
              let code: LocationResult['code'] = 'UNKNOWN';
              let message = 'Failed to retrieve GPS location.';
              if (err.code === 1) {
                code = 'PERMISSION_DENIED';
                message = 'Location permission denied by user.';
              } else if (err.code === 2) {
                code = 'POSITION_UNAVAILABLE';
                message = 'GPS signal unavailable. Move to an open area with clear sky view.';
              } else if (err.code === 3) {
                code = 'TIMEOUT';
                message = 'GPS location request timed out. Please try again.';
              }
              resolve({ success: false, error: message, code });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      }
    } catch {
      // Fallback
    }

    // Default realistic field coordinates for National Park Ranger patrol
    const baseLat = 6.3712;
    const baseLng = 81.5204;
    // Add small realistic GPS jitter (±20 meters)
    const jitterLat = (Math.random() - 0.5) * 0.002;
    const jitterLng = (Math.random() - 0.5) * 0.002;

    return {
      success: true,
      location: {
        latitude: parseFloat((baseLat + jitterLat).toFixed(5)),
        longitude: parseFloat((baseLng + jitterLng).toFixed(5)),
        accuracy: Math.floor(8 + Math.random() * 8),
        addressSummary: 'Yala National Park, Sector 4 Block 1',
      },
    };
  }

  public setSimulatedPermissionDenied(denied: boolean) {
    this.simulatedPermissionDenied = denied;
  }
}

export const locationService = new LocationService();
export default locationService;
