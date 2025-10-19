import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Save last used aircraft registration
 */
export const saveLastAircraft = async (registration: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_AIRCRAFT, registration);
  } catch (error) {
    console.error('Error saving last aircraft:', error);
  }
};

/**
 * Get last used aircraft registration
 */
export const getLastAircraft = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_AIRCRAFT);
  } catch (error) {
    console.error('Error getting last aircraft:', error);
    return null;
  }
};

/**
 * Save last calculation values for an aircraft
 */
export const saveLastCalculation = async (
  registration: string,
  data: {
    stationWeights: Record<string, number>;
    fuelWeight: number;
  }
): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.LAST_CALCULATION}_${registration}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving last calculation:', error);
  }
};

/**
 * Get last calculation values for an aircraft
 */
export const getLastCalculation = async (
  registration: string
): Promise<{ stationWeights: Record<string, number>; fuelWeight: number } | null> => {
  try {
    const key = `${STORAGE_KEYS.LAST_CALCULATION}_${registration}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting last calculation:', error);
    return null;
  }
};
