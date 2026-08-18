import { useEffect } from 'react'
import { ThemeProvider } from 'styled-components'
import GlobalStyle from './styles.js'
import theme from './theme.js'
import GridOverlay from './components/GridOverlay.jsx'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home'
import Exhibition from './pages/Exhibition'
import { site } from './content.js'
import { usePathname } from './router.jsx'

function App() {
  const pathname = usePathname()
  const exhibition = pathname.match(/^\/exhibitions\/([a-z0-9-]+)\/?$/)

  useEffect(() => {
    document.title = site.title
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Navigation />
      {exhibition ? <Exhibition slug={exhibition[1]} /> : <Home />}
      {!exhibition && <Footer />}
    </ThemeProvider>
  )
}

export default App
