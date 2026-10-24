/**
 * Device-type hook — single source of truth for adaptive layout.
 *
 * `isTablet` distinguishes tablets from phones (iPad, or any device whose
 * smallest window dimension is at least 600pt). `isWide` marks tablets in a
 * wide enough window (landscape, or large portrait iPad) to show the
 * two-column layouts. Phones and narrow windows fall back to the existing
 * single-column layouts, so nothing changes on iPhone.
 */
import { Platform, useWindowDimensions } from 'react-native';
import { layout } from '../theme/spacing';

export interface DeviceType {
  isTablet: boolean;
  isWide: boolean;
  width: number;
  height: number;
}

export const useDeviceType = (): DeviceType => {
  const { width, height } = useWindowDimensions();

  // Platform.isPad is iOS-only; cast since RN types the static per-OS.
  const isPad =
    Platform.OS === 'ios' &&
    (Platform as unknown as { isPad?: boolean }).isPad === true;

  const isTablet = isPad || Math.min(width, height) >= 600;
  // Wide = landscape: two-column/3-slot layouts. Portrait tablets get the
  // portrait-tablet layout instead.
  const isWide = isTablet && width > height;

  return { isTablet, isWide, width, height };
};
