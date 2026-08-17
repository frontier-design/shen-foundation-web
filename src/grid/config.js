const BREAKPOINT = "768px";
const BREAKPOINT_TABLET = "1024px";

export const GRID = {
  // ── Desktop ────────────────────────────────────────────────
  COLUMNS: 12,
  MAX_WIDTH: 2800,
  PADDING: 35,
  GAP: 6,
  ROW_GAP: "2rem",

  // ── Tablet (≤ BREAKPOINT_TABLET) ───────────────────────────
  COLUMNS_TABLET: 8,
  PADDING_TABLET: 35,
  GAP_TABLET: "1rem",
  ROW_GAP_TABLET: "1.5rem",

  // ── Mobile (≤ BREAKPOINT) ──────────────────────────────────
  COLUMNS_MOBILE: 4,
  PADDING_MOBILE: 20,
  GAP_MOBILE: "1rem",
  ROW_GAP_MOBILE: "1.5rem",

  // ── Breakpoints ────────────────────────────────────────────
  BREAKPOINT,
  BREAKPOINT_TABLET,

  MEDIA_MOBILE: `(max-width: ${BREAKPOINT})`,
  MEDIA_TABLET: `(max-width: ${BREAKPOINT_TABLET})`,
};

export default GRID;
