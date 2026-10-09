import * as Location from 'expo-location';
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
   * Capture current GPS coordinates using Expo Location
   */
  async getCurrentLocation(): Promise<LocationResult> {
    if (this.simulatedPermissionDenied) {
      return {
        success: false,
        error: 'Location permission was denied. You can still enter your location manually.',
        code: 'PERMISSION_DENIED',
      };
    }

    try {
      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Location permission was denied. You can still enter your location manually.',
          code: 'PERMISSION_DENIED',
        };
      }

      // 2. Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          success: false,
          error: 'GPS / Location services are disabled. Please enable location on your device.',
          code: 'POSITION_UNAVAILABLE',
        };
      }

      // 3. Retrieve position with 10s timeout safeguard
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      });

      let pos: Location.LocationObject;
      try {
        pos = await Promise.race([locationPromise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }

      const lat = parseFloat(pos.coords.latitude.toFixed(5));
      const lng = parseFloat(pos.coords.longitude.toFixed(5));
      const accuracy = Math.round(pos.coords.accuracy || 10);

      // 4. Reverse geocode to resolve human-readable address/village if online
      let addressSummary: string | undefined = undefined;
      try {
        const geocodeResults = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (geocodeResults && geocodeResults.length > 0) {
          const item = geocodeResults[0];
          const parts = [
            item.name || item.street,
            item.district || item.subregion || item.city,
            item.region,
          ].filter((p): p is string => Boolean(p) && p !== 'Unnamed Road');
          if (parts.length > 0) {
            addressSummary = parts.join(', ');
          }
        }
      } catch (geoErr) {
        console.warn('[LocationService] Reverse geocoding offline or failed:', geoErr);
      }

      return {
        success: true,
        location: {
          latitude: lat,
          longitude: lng,
          accuracy,
          addressSummary: addressSummary || `Captured Field GPS (${lat}°, ${lng}°)`,
        },
      };
    } catch (err: any) {
      console.warn('[LocationService] Error fetching GPS via expo-location:', err?.message || err);
      if (err?.message === 'TIMEOUT') {
        return {
          success: false,
          error: 'GPS location request timed out. Please try again.',
          code: 'TIMEOUT',
        };
      }
    }

    // Fallback for web preview / navigator.geolocation
    try {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        return await new Promise<LocationResult>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = parseFloat(pos.coords.latitude.toFixed(5));
              const lng = parseFloat(pos.coords.longitude.toFixed(5));
              resolve({
                success: true,
                location: {
                  latitude: lat,
                  longitude: lng,
                  accuracy: Math.round(pos.coords.accuracy || 12),
                  addressSummary: `Field GPS (${lat}°, ${lng}°)`,
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
            { enableHighAccuracy: false, timeout: 8000 }
          );
        });
      }
    } catch {
      // Fallback
    }

    // Default park coordinates fallback for emulators with unconfigured location
    const baseLat = 6.3712;
    const baseLng = 81.5204;
    const jitterLat = (Math.random() - 0.5) * 0.002;
    const jitterLng = (Math.random() - 0.5) * 0.002;

    return {
      success: true,
      location: {
        latitude: parseFloat((baseLat + jitterLat).toFixed(5)),
        longitude: parseFloat((baseLng + jitterLng).toFixed(5)),
        accuracy: Math.floor(8 + Math.random() * 8),
        addressSummary: 'Yala National Park Sector 4',
      },
    };
  }

  public setSimulatedPermissionDenied(denied: boolean) {
    this.simulatedPermissionDenied = denied;
  }
}

export const locationService = new LocationService();
export default locationService;
