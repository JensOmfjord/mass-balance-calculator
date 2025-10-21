import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedAircraftConfig {
  registration: string;
  stationWeights: Record<string, number>;
  fuelVolume: number;
  fuelBurn: number;
  lastUpdated: number; // timestamp
}

const STORAGE_KEY_PREFIX = '@aircraft_config_';

/**
 * Save aircraft configuration to local storage
 */
export const saveAircraftConfig = async (config: SavedAircraftConfig): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${config.registration}`;
    const value = JSON.stringify({
      ...config,
      lastUpdated: Date.now(),
    });
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving aircraft config:', error);
  }
};

/**
 * Load aircraft configuration from local storage
 */
export const loadAircraftConfig = async (registration: string): Promise<SavedAircraftConfig | null> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${registration}`;
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error('Error loading aircraft config:', error);
    return null;
  }
};

/**
 * Clear all saved aircraft configurations (useful for debugging)
 */
export const clearAllAircraftConfigs = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const aircraftKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    await AsyncStorage.multiRemove(aircraftKeys);
  } catch (error) {
    console.error('Error clearing aircraft configs:', error);
  }
};

/**
 * Get all saved aircraft registrations
 */
export const getAllSavedRegistrations = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const aircraftKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    return aircraftKeys.map(key => key.replace(STORAGE_KEY_PREFIX, ''));
  } catch (error) {
    console.error('Error getting saved registrations:', error);
    return [];
  }
};
