import { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(() => networkService.getStatus().isConnected);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(
    () => networkService.getStatus().isInternetReachable
  );

  useEffect(() => {
    const unsubscribe = networkService.subscribe((connected) => {
      setIsConnected(connected);
      setIsInternetReachable(networkService.getStatus().isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleSimulation = () => {
    const current = networkService.isOfflineSimulated();
    if (current === true) {
      networkService.setSimulatedOffline(null); // Restore real
    } else {
      networkService.setSimulatedOffline(true); // Simulate offline
    }
  };

  return {
    isConnected,
    isInternetReachable,
    isSimulatedOffline: networkService.isOfflineSimulated() === true,
    toggleSimulation,
  };
};

export default useNetworkStatus;
