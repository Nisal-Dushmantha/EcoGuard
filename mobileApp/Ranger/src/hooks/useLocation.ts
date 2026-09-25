import { useState, useCallback } from 'react';
import { IncidentLocation } from '../types/incident';
import { locationService } from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState<IncidentLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await locationService.getCurrentLocation();
      if (res.success && res.location) {
        setLocation(res.location);
        return res.location;
      } else {
        const errorMsg = res.error || 'Failed to capture GPS coordinates.';
        setError(errorMsg);
        return null;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Unexpected error accessing GPS.';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    captureLocation,
    clearLocation,
    setLocation,
  };
};

export default useLocation;
