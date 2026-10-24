/**
 * Multimodal feedback — haptics at meaningful moments only (causality + utility).
 * Same-frame triggers: call at the causal event (toggle flip, commit, snap).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios';

/** Light tap — toggle flips, chip selection, slider snap points. */
export const hapticTap = () => {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Medium tap — commits, value sheet save. */
export const hapticCommit = () => {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

/** Success — GO status, envelope in-limits confirmations. */
export const hapticSuccess = () => {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

/** Warning — marginal / caution states. */
export const hapticWarning = () => {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

/** Error — NO-GO / out-of-envelope states. */
export const hapticError = () => {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
