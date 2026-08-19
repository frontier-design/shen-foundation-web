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
import Event from './pages/Event'
import { site } from './content.js'
import { usePathname } from './router.jsx'

const MobileOnlyFooter = styled.div`
  display: none;

  @media ${GRID.MEDIA_MOBILE} {
    display: block;
  }
`

function App() {
  const pathname = usePathname()
  const exhibition = pathname.match(/^\/exhibitions\/([a-z0-9-]+)\/?$/)
  const exhibitionsIndex = pathname === '/exhibitions' || pathname === '/exhibitions/'
  const event = pathname.match(/^\/events\/([a-z0-9-]+)\/?$/)

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
      ) : event ? (
        <Event slug={event[1]} />
      ) : (
        <Home />
      )}
      {event ? (
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
