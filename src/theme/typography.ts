/**
 * Apple-style typography.
 * System font, size-specific tracking: tightened for large text,
 * neutral for body, slightly open for small secondary labels.
 */
import { Platform, TextStyle } from 'react-native';

const family = Platform.select({ ios: 'system', default: undefined }) as string | undefined;

export const typography: Record<string, TextStyle> = {
  // Large title — nav bar hero text (tight tracking & leading)
  largeTitle: {
    fontFamily: family,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37, // iOS large title uses +0.37 tracking
    lineHeight: 41,
  },

  // Title 1 — section heroes
  title1: {
    fontFamily: family,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.36,
    lineHeight: 34,
  },

  // Title 2 — card titles
  title2: {
    fontFamily: family,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.35,
    lineHeight: 28,
  },

  // Title 3 — list section headers
  title3: {
    fontFamily: family,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.38,
    lineHeight: 25,
  },

  // Headline — emphasized row text
  headline: {
    fontFamily: family,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    lineHeight: 22,
  },

  // Body
  body: {
    fontFamily: family,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 22,
  },

  // Callout
  callout: {
    fontFamily: family,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.32,
    lineHeight: 21,
  },

  // Subhead — secondary row text
  subhead: {
    fontFamily: family,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.24,
    lineHeight: 20,
  },

  // Footnote — small annotations
  footnote: {
    fontFamily: family,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    lineHeight: 18,
  },

  // Caption — smallest label (slightly open tracking for legibility)
  caption1: {
    fontFamily: family,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },

  caption2: {
    fontFamily: family,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.07,
    lineHeight: 13,
  },

  // Numeric emphasis — tabular figures for values
  value: {
    fontFamily: family,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    fontVariant: ['tabular-nums'],
  },

  valueLarge: {
    fontFamily: family,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.35,
    fontVariant: ['tabular-nums'],
  },
};
