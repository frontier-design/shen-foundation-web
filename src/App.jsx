import { useEffect } from 'react'
import { ThemeProvider } from 'styled-components'
import GlobalStyle from './styles.js'
import theme from './theme.js'
import GridOverlay from './components/GridOverlay.jsx'
import Navigation from './components/Navigation.jsx'
import Home from './pages/Home'
import { site } from './content.js'

function App() {
  useEffect(() => {
    document.title = site.title
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Navigation />
      <Home />
    </ThemeProvider>
  )
}

export default App
