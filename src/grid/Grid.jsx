import styled, { css } from 'styled-components'
import { GRID } from './config.js'

export const Grid = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(${GRID.COLUMNS}, 1fr);
  column-gap: ${GRID.GAP}px;
  row-gap: ${GRID.ROW_GAP};
  width: 100%;
  max-width: ${props => (props.$fullBleed ? '100%' : `min(${GRID.MAX_WIDTH}px, 100%)`)};
  margin: 0 auto;
  padding: ${props => (props.$fullBleed ? '0' : `0 ${GRID.PADDING}px`)};
  overflow-wrap: break-word;

  @media ${GRID.MEDIA_TABLET} {
    grid-template-columns: repeat(${GRID.COLUMNS_TABLET}, 1fr);
    column-gap: ${GRID.GAP_TABLET};
    row-gap: ${GRID.ROW_GAP_TABLET};
    padding: ${props => (props.$fullBleed ? '0' : `0 ${GRID.PADDING_TABLET}px`)};
  }

  @media ${GRID.MEDIA_MOBILE} {
    grid-template-columns: repeat(${GRID.COLUMNS_MOBILE}, 1fr);
    padding: ${props => (props.$fullBleed ? '0' : `0 ${GRID.PADDING_MOBILE}px`)};
    column-gap: ${GRID.GAP_MOBILE};
    row-gap: ${GRID.ROW_GAP_MOBILE};
  }
`

// ─── GridCell ────────────────────────────────────────────────────────────────

/**
 * GridCell — a grid child positioned and sized via transient props.
 *
 * Column props (use $ prefix):
 *   $start        — column start (1-based), default 1
 *   $span         — columns to span; when omitted the cell fills to the
 *                   last column. Spans are clamped so they never overflow
 *                   the active breakpoint's column count.
 *   $end          — column end line (exclusive); alternative to $span
 *   $startTablet  — column start on tablet (optional)
 *   $spanTablet   — span on tablet (optional)
 *   $endTablet    — column end on tablet (optional)
 *   $startMobile  — column start on mobile (optional)
 *   $spanMobile   — span on mobile (optional)
 *   $endMobile    — column end on mobile (optional)
 *
 * Row props (optional):
 *   $rowStart     — grid-row start (1-based)
 *   $rowSpan      — rows to span
 *   $rowEnd       — grid-row end line (exclusive); alternative to $rowSpan
 *
 * Special:
 *   $subgrid      — if true, the cell itself becomes a subgrid whose
 *                   children align to the parent grid's column tracks.
 *
 * When NO mobile props are set the cell defaults to full width (1 / -1)
 * on mobile, so you only need to pass mobile props when you want a
 * specific placement.
 *
 * Examples:
 *   <GridCell $start={1} $span={8}>            → desktop cols 1–8
 *   <GridCell $start={1} $end={9}>             → desktop cols 1–8 (end exclusive)
 *   <GridCell $span={6} $spanMobile={4}>       → 6 cols desktop, full width mobile
 *   <GridCell $span={6} $rowSpan={2}>          → 6 cols, spanning 2 rows
 *   <GridCell $span={12} $subgrid>             → subgrid spanning all 12 cols
 */

/* helper: build a grid-column value, clamped to the tier's column count
   so a desktop placement can never overflow a narrower grid */
const colValue = (start, span, end, columns) => {
  const s = Math.min(Math.max(start ?? 1, 1), columns)
  if (end != null) return `${s} / ${end < 0 ? end : Math.min(end, columns + 1)}`
  if (span == null) return `${s} / -1`
  return `${s} / span ${Math.max(1, Math.min(span, columns - s + 1))}`
}

export const GridCell = styled.div`
  box-sizing: border-box;
  min-width: 0;

  /* ── Column placement (desktop) ── */
  grid-column: ${p => colValue(p.$start, p.$span, p.$end, GRID.COLUMNS)};

  /* ── Row placement (all breakpoints, optional) ── */
  ${p => {
    if (p.$rowStart == null && p.$rowSpan == null && p.$rowEnd == null) return ''
    const s = p.$rowStart ?? 1
    if (p.$rowEnd != null) return css`grid-row: ${s} / ${p.$rowEnd};`
    const span = p.$rowSpan ?? 1
    return css`grid-row: ${s} / span ${span};`
  }}

  /* ── Subgrid ── */
  ${p => p.$subgrid && css`
    display: grid;
    grid-template-columns: subgrid;
  `}

  /* ── Tablet ── */
  @media ${GRID.MEDIA_TABLET} {
    grid-column: ${p => {
      const has = p.$startTablet != null || p.$spanTablet != null || p.$endTablet != null
      if (!has) return colValue(p.$start, p.$span, p.$end, GRID.COLUMNS_TABLET)
      return colValue(p.$startTablet, p.$spanTablet, p.$endTablet, GRID.COLUMNS_TABLET)
    }};
  }

  /* ── Mobile ── */
  @media ${GRID.MEDIA_MOBILE} {
    grid-column: ${p => {
      const has = p.$startMobile != null || p.$spanMobile != null || p.$endMobile != null
      if (!has) return '1 / -1'
      return colValue(p.$startMobile, p.$spanMobile, p.$endMobile, GRID.COLUMNS_MOBILE)
    }};
  }
`

// ─── Convenience span components ─────────────────────────────────────────────

/**
 * Pre-configured GridCell wrappers for the most common column spans.
 * Each defaults to full width on mobile (GridCell's default).
 *
 *   <GridSpan4>   → 4 columns
 *   <GridSpan6>   → 6 columns (half)
 *   <GridSpan8>   → 8 columns (two-thirds)
 *   <GridSpan12>  → 12 columns (full width)
 *
 * You can still pass any GridCell prop to override:
 *   <GridSpan6 $start={4} $spanMobile={2}>…</GridSpan6>
 */
export const GridSpan4 = styled(GridCell).attrs(p => ({ $span: p.$span ?? 4 }))``
export const GridSpan6 = styled(GridCell).attrs(p => ({ $span: p.$span ?? 6 }))``
export const GridSpan8 = styled(GridCell).attrs(p => ({ $span: p.$span ?? 8 }))``
export const GridSpan12 = styled(GridCell).attrs(p => ({ $span: p.$span ?? 12 }))``

// Re-export config for convenience
export { GRID } from './config.js'
