import { useEffect } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import GlobalStyle from './styles.js'
import theme from './theme.js'
import { GRID } from './grid'
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
import { site } from './content.js'
import { usePathname } from './router.jsx'

const MobileOnlyFooter = styled.div`
  display: none;

  @media ${GRID.MEDIA_TABLET} {
    display: block;
  }
`

function App() {
  const pathname = usePathname()
  const exhibition = pathname.match(/^\/exhibitions\/([a-z0-9-]+)\/?$/)
  const exhibitionsIndex = pathname === '/exhibitions' || pathname === '/exhibitions/'
  const artist = pathname.match(/^\/artists\/([a-z0-9-]+)\/?$/)
  const artistsIndex = pathname === '/artists' || pathname === '/artists/'
  const event = pathname.match(/^\/events\/([a-z0-9-]+)\/?$/)
  const eventsIndex = pathname === '/events' || pathname === '/events/'

  useEffect(() => {
    document.title = site.title
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Navigation />
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
    </ThemeProvider>
  )
}

export default App
