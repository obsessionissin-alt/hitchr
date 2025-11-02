import * as ExpoLocation from 'expo-location';
import { Location } from '../types';

class LocationService {
  private watchSubscription: ExpoLocation.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location | null> {
    try {
      const { coords } = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async startWatchingLocation(
    callback: (location: ExpoLocation.LocationObject) => void
  ): Promise<void> {
    try {
      this.watchSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback
      );
    } catch (error) {
      console.error('Watch location error:', error);
    }
  }

  stopWatchingLocation() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }
}

export default new LocationService();