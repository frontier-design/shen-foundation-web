import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styled, { ThemeProvider, css, keyframes } from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import GlobalStyle from './styles.js'
import theme, { easing, duration, colors } from './theme.js'
import { GRID, useMediaQuery } from './grid'

gsap.registerPlugin(CustomEase)
if (!CustomEase.get('reveal')) CustomEase.create('reveal', easing.gsapReveal)
import GridOverlay from './components/GridOverlay.jsx'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import PreviewBanner from './components/PreviewBanner.jsx'
import Home from './pages/Home'
import Exhibition from './pages/Exhibition'
import ExhibitionsIndex from './pages/Exhibitions'
import Artists from './pages/Artists'
import IndividualArtist from './pages/IndividualArtist'
import Event from './pages/Event'
import EventsIndex from './pages/Events'
import About from './pages/About'
import Test from './pages/Test'
import { usePathname, historyKey, lastNavigationType } from './router.jsx'
import { markLoadingDone } from './loading.js'

const SITE_TITLE = 'Shen Foundation'

let scrollLocks = 0

function lockScroll() {
  scrollLocks += 1
  document.documentElement.style.overflow = 'hidden'
  return () => {
    scrollLocks -= 1
    if (scrollLocks === 0) document.documentElement.style.overflow = ''
  }
}

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

const PageLayer = styled.div`
  ${(props) =>
    props.$overlay &&
    css`
      position: fixed;
      inset: 0;
      z-index: 10;
      overflow: hidden;
      background-color: ${colors.white};
      animation: ${slideIn} ${duration.slow}s ${easing.reveal} both;
      will-change: transform;
    `}
`

const LoadingScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 95;
  background-color: ${colors.white};
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
  const testIndex = pathname === '/test' || pathname === '/test/'

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
      ) : testIndex ? (
        <Test />
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
  const [base, setBase] = useState(() => ({ path: pathname, id: 0 }))
  const [incoming, setIncoming] = useState(null)
  const [prevPath, setPrevPath] = useState(pathname)
  const [loaderVisible, setLoaderVisible] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const loaderRef = useRef(null)
  const positionsRef = useRef(new Map())
  const baseKeyRef = useRef(null)

  if (prevPath !== pathname) {
    setPrevPath(pathname)
    const next = { path: pathname, id: Math.max(base.id, incoming?.id ?? 0) + 1 }
    if (reduceMotion) {
      setBase(next)
      setIncoming(null)
    } else {
      setIncoming(next)
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
    const tl = gsap.timeline()
    tl.to(loaderRef.current, {
      yPercent: -100,
      duration: duration.slow,
      ease: 'reveal',
      delay: 0.6,
      onStart: () => markLoadingDone(),
      onComplete: () => setLoaderVisible(false),
    })
    return () => tl.kill()
  }, [])

  useEffect(() => {
    if (!loaderVisible) return undefined
    return lockScroll()
  }, [loaderVisible])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useLayoutEffect(() => {
    baseKeyRef.current = historyKey()
    if (lastNavigationType() !== 'pop') return
    const y = positionsRef.current.get(baseKeyRef.current)
    if (y) window.scrollTo(0, y)
  }, [base])

  useEffect(() => {
    const save = () => {
      const key = historyKey()
      if (key && key === baseKeyRef.current) positionsRef.current.set(key, window.scrollY)
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [])

  useEffect(() => {
    if (incoming === null) return undefined
    return lockScroll()
  }, [incoming])

  const finishTransition = (e) => {
    if (e.target !== e.currentTarget) return
    setBase(incoming)
    setIncoming(null)
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Navigation />
      {import.meta.env.VITE_PREVIEW && <PreviewBanner />}
      <PageLayer key={base.id}>
        <RouteView pathname={base.path} />
      </PageLayer>
      {incoming !== null ? (
        <PageLayer key={incoming.id} $overlay onAnimationEnd={finishTransition}>
          <RouteView pathname={incoming.path} />
        </PageLayer>
      ) : null}
      {loaderVisible ? <LoadingScreen ref={loaderRef} /> : null}
    </ThemeProvider>
  )
}

export default App
