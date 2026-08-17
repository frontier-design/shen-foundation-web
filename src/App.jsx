import { useEffect } from 'react'
import GlobalStyle from './styles.js'
import GridOverlay from './components/GridOverlay.jsx'
import Home from './pages/Home'
import { site } from './content.js'

function App() {
  useEffect(() => {
    document.title = site.title
  }, [])

  return (
    <>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <Home />
    </>
  )
}

export default App
