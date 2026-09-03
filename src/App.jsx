import { useEffect, useLayoutEffect, useState } from 'react'
import styled, { ThemeProvider, keyframes } from 'styled-components'
import GlobalStyle from './styles.js'
import theme, { easing, duration, colors } from './theme.js'
import { GRID, useMediaQuery } from './grid'
import GridOverlay from './components/GridOverlay.jsx'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home'
import Exhibition from './pages/Exhibition'
import ExhibitionsIndex from './pages/Exhibitions'
import Artists from './pages/Artists'
import IndividualArtist from './pages/IndividualArtist'
import Event from './pages/Event'
import EventsIndex from './pages/Events'
import About from './pages/About'
import { usePathname } from './router.jsx'

const SITE_TITLE = 'Shen Foundation'

const MobileOnlyFooter = styled.div`
  display: none;

  @media ${GRID.MEDIA_TABLET} {
    display: block;
  }
`

const slideIn = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`

const OverlayLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  background-color: ${colors.white};
  animation: ${slideIn} ${duration.slow}s ${easing.reveal} both;
  will-change: transform;
`

function RouteView({ pathname }) {
  const exhibition = pathname.match(/^\/exhibitions\/([a-z0-9-]+)\/?$/)
  const exhibitionsIndex = pathname === '/exhibitions' || pathname === '/exhibitions/'
  const artist = pathname.match(/^\/artists\/([a-z0-9-]+)\/?$/)
  const artistsIndex = pathname === '/artists' || pathname === '/artists/'
  const event = pathname.match(/^\/events\/([a-z0-9-]+)\/?$/)
  const eventsIndex = pathname === '/events' || pathname === '/events/'
  const aboutIndex = pathname === '/about' || pathname === '/about/'

  return (
    <>
      {exhibition ? (
        <Exhibition slug={exhibition[1]} />
      ) : exhibitionsIndex ? (
        <ExhibitionsIndex />
      ) : artist ? (
        <IndividualArtist slug={artist[1]} />
      ) : artistsIndex ? (
        <Artists />
      ) : event ? (
        <Event slug={event[1]} />
      ) : eventsIndex ? (
        <EventsIndex />
      ) : aboutIndex ? (
        <About />
      ) : (
        <Home />
      )}
      {event || artist ? (
        <MobileOnlyFooter>
          <Footer />
        </MobileOnlyFooter>
      ) : (
        <Footer />
      )}
    </>
  )
}

function App() {
  const pathname = usePathname()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [base, setBase] = useState(pathname)
  const [incoming, setIncoming] = useState(null)
  const [prevPath, setPrevPath] = useState(pathname)

  if (prevPath !== pathname) {
    setPrevPath(pathname)
    if (reduceMotion) {
      setBase(pathname)
      setIncoming(null)
    } else {
      setIncoming(pathname)
    }
  }

  useEffect(() => {
    document.title = SITE_TITLE
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [base])

  useEffect(() => {
    if (incoming === null) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [incoming])

  const finishTransition = (e) => {
    if (e.target !== e.currentTarget) return
    setBase(pathname)
    setIncoming(null)
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Navigation />
      <RouteView pathname={base} />
      {incoming !== null ? (
        <OverlayLayer key={incoming} onAnimationEnd={finishTransition}>
          <RouteView pathname={incoming} />
        </OverlayLayer>
      ) : null}
    </ThemeProvider>
  )
}

export default App
