/** 10 SVG px = 1mm on canvas export (same convention as the keychain generator). */
export const PX_TO_MM_RATIO = 10;

/** Every template is authored in this square design space. */
export const DESIGN_SIZE = 150;

/** Color roles used by the designer inside template SVGs (lowercase hex, as paper.js reports them). */
export const ROLE_COLORS = {
  /** Text-on-path baseline (stroke only, never exported). */
  baseline: '#1890ff',
  /** Engraved frame rings; the outermost one doubles as the cut outline. */
  frame: '#e5400a',
} as const;
