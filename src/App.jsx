import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styled, { ThemeProvider, keyframes } from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import GlobalStyle from './styles.js'
import theme, { easing, duration, colors } from './theme.js'
import { Grid, GridCell, GRID, useMediaQuery } from './grid'
import wordmark from './assets/images/logos/shen-wordmark-oneline.svg'

gsap.registerPlugin(CustomEase)
if (!CustomEase.get('reveal')) CustomEase.create('reveal', easing.gsapReveal)
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
import { markLoadingDone } from './loading.js'

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

const LoadingScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: ${colors.white};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: clamp(20px, 3vh, 40px);
  will-change: transform;
`

const LoaderWordmark = styled.div`
  width: 100%;
  aspect-ratio: 1188 / 113;
  background-color: ${colors.black};
  -webkit-mask: url(${wordmark}) no-repeat center / contain;
  mask: url(${wordmark}) no-repeat center / contain;
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
  const [loaderVisible, setLoaderVisible] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const loaderRef = useRef(null)
  const markRef = useRef(null)

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
    if (!loaderRef.current) {
      markLoadingDone()
      return
    }
    const startY = window.innerHeight - markRef.current.getBoundingClientRect().top
    const tl = gsap.timeline()
    tl.set(markRef.current, { y: startY })
      .to(markRef.current, { y: 0, duration: 1.1, ease: 'reveal' }, 0.25)
      .to(
        loaderRef.current,
        {
          yPercent: -100,
          duration: duration.slow,
          ease: 'reveal',
          onComplete: () => {
            setLoaderVisible(false)
            markLoadingDone()
          },
        },
        '+=0.5',
      )
    return () => tl.kill()
  }, [])

  useEffect(() => {
    if (!loaderVisible) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [loaderVisible])

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
      {loaderVisible ? (
        <LoadingScreen ref={loaderRef}>
          <Grid>
            <GridCell $start={1} $end={-1}>
              <LoaderWordmark ref={markRef} role="img" aria-label="Shen Foundation" />
            </GridCell>
          </Grid>
        </LoadingScreen>
      ) : null}
    </ThemeProvider>
  )
}

export default App
