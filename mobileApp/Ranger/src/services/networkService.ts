import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkChangeCallback = (isConnected: boolean) => void;

class NetworkService {
  private isConnected: boolean = true;
  private isInternetReachable: boolean | null = true;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private simulatedOffline: boolean | null = null; // for debugging / demo in field mode

  constructor() {
    this.init();
  }

  private init() {
    try {
      NetInfo.addEventListener((state: NetInfoState) => {
        const connected = state.isConnected ?? false;
        const reachable = state.isInternetReachable ?? connected;
        this.updateState(connected, reachable);
      });

      NetInfo.fetch().then((state) => {
        this.updateState(state.isConnected ?? false, state.isInternetReachable ?? state.isConnected);
      }).catch(() => {
        // Default to true in offline test environments
      });
    } catch {
      // In jest / non-native environments NetInfo may not be native-linked
    }
  }

  private updateState(connected: boolean, reachable: boolean | null) {
    const effectiveStatus = this.simulatedOffline !== null ? !this.simulatedOffline : (connected && reachable !== false);
    if (this.isConnected !== effectiveStatus) {
      this.isConnected = effectiveStatus;
      this.isInternetReachable = reachable;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.isConnected);
      } catch (err) {
        console.error('Error in network listener:', err);
      }
    });
  }

  public getStatus(): { isConnected: boolean; isInternetReachable: boolean | null } {
    if (this.simulatedOffline !== null) {
      return { isConnected: !this.simulatedOffline, isInternetReachable: !this.simulatedOffline };
    }
    return { isConnected: this.isConnected, isInternetReachable: this.isInternetReachable };
  }

  public subscribe(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);
    // Immediately trigger with current status
    callback(this.getStatus().isConnected);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * For testing & field demonstration: Allows manual toggle of offline/online state
   */
  public setSimulatedOffline(isOffline: boolean | null) {
    this.simulatedOffline = isOffline;
    const current = this.getStatus().isConnected;
    this.notifyListeners();
  }

  public isOfflineSimulated(): boolean | null {
    return this.simulatedOffline;
  }
}

export const networkService = new NetworkService();
export default networkService;
