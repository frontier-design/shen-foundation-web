import styled from 'styled-components'
import { GRID } from '../grid'
import { colors, type } from '../theme.js'

const Banner = styled.div`
  position: fixed;
  right: ${GRID.PADDING}px;
  bottom: calc(${GRID.PADDING}px + env(safe-area-inset-bottom, 0px));
  z-index: 94;
  padding: 6px 12px;
  border-radius: 999px;
  background-color: ${colors.black};
  color: ${colors.white};
  ${type.navDescription};
  pointer-events: none;

  @media ${GRID.MEDIA_TABLET} {
    right: ${GRID.PADDING_TABLET}px;
    bottom: calc(${GRID.PADDING_TABLET}px + env(safe-area-inset-bottom, 0px));
  }

  @media ${GRID.MEDIA_MOBILE} {
    right: ${GRID.PADDING_MOBILE}px;
    bottom: calc(${GRID.PADDING_MOBILE}px + env(safe-area-inset-bottom, 0px));
  }
`

function PreviewBanner() {
  return <Banner role="status">Preview — these changes aren&rsquo;t live yet.</Banner>
}

export default PreviewBanner
