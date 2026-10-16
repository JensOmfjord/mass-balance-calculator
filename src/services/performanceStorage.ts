import AsyncStorage from '@react-native-async-storage/async-storage';
import { FieldConditions } from '../models/Performance';

export interface SavedPerformanceConfig {
  registration: string;
  sameField: boolean;
  departure: FieldConditions;
  arrival: FieldConditions;
  lastUpdated: number; // timestamp
}

const STORAGE_KEY_PREFIX = '@performance_config_';

export const savePerformanceConfig = async (config: SavedPerformanceConfig): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${config.registration}`;
    const value = JSON.stringify({
      ...config,
      lastUpdated: Date.now(),
    });
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving performance config:', error);
  }
};

export const loadPerformanceConfig = async (
  registration: string
): Promise<SavedPerformanceConfig | null> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${registration}`;
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error('Error loading performance config:', error);
    return null;
  }
};
