import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { GRID, Grid } from '../grid'
import { useMediaQuery } from '../grid/useMediaQuery'

const GridContainer = styled.div`
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 100vw;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
  overflow: hidden;
`

const GridInner = styled(Grid)`
  height: 100%;
  display: ${props => (props.$isVisible ? 'grid' : 'none')};
  overflow: hidden;
`

const GridColumn = styled.div`
  box-sizing: border-box;
  min-width: 0;
  background-color: rgb(245 245 245 / 22%);
  min-height: 100vh;
`

function GridOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const isMobile = useMediaQuery(GRID.MEDIA_MOBILE)
  const isTablet = useMediaQuery(GRID.MEDIA_TABLET)

  const columnCount = isMobile
    ? GRID.COLUMNS_MOBILE
    : isTablet
      ? GRID.COLUMNS_TABLET
      : GRID.COLUMNS

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key !== 'g' && e.key !== 'G') return
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      setIsVisible(prev => !prev)
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  return (
    <GridContainer>
      <GridInner $isVisible={isVisible}>
        {Array.from({ length: columnCount }).map((_, index) => (
          <GridColumn key={index} />
        ))}
      </GridInner>
    </GridContainer>
  )
}

export default GridOverlay
