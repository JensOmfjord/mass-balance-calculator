/**
 * Spacing tokens — 4pt grid, iOS-style layout rhythm.
 */
export const spacing = {
  /** 2 — hairline adjustments */
  xs: 2,
  /** 4 */
  sm: 4,
  /** 8 */
  md: 8,
  /** 12 */
  lg: 12,
  /** 16 — default intra-card padding */
  xl: 16,
  /** 20 */
  xxl: 20,
  /** 32 — section gaps */
  section: 32,
} as const;

/** iOS inset grouped list geometry */
export const list = {
  /** 2 */
  xs: 2,
  /** 4 */
  sm: 4,
  /** 8 */
  md: 8,
  /** 12 */
  lg: 12,
  /** 16 — default intra-card padding */
  xl: 16,
  /** 20 */
  xxl: 20,
  /** 32 — section gaps */
  section: 32,
  /** 16 — side inset for grouped sections */
  insetHorizontal: 16,
  /** 10 — gap between grouped cards */
  cardGap: 10,
  /** 10 — corner radius of grouped cards */
  cardRadius: 10,
  /** 35 — bottom content padding */
  bottomPadding: 35,
} as const;
