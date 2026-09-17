import styled from 'styled-components'
import { getPage, homeHeroSlides, homeGridCards, homeCallout } from '../../content.js'
import HeroCarousel from './components/HeroCarousel.jsx'
import HomepageCallout from './components/HomepageCallout.jsx'
import CardGrid from '../../components/CardGrid.jsx'

const ScreenReaderTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

function Test() {
  const page = getPage('home')

  if (!page) return null

  const slides = homeHeroSlides(page.heroSlides)
  const callout = homeCallout(page.callout)

  return (
    <main>
      <ScreenReaderTitle>Test</ScreenReaderTitle>
      <HeroCarousel key={slides.map((s) => s.image).join('|')} slides={slides} />
      {callout && <HomepageCallout callout={callout} />}
      {page.grid?.length > 0 && <CardGrid items={homeGridCards(page.grid)} />}
    </main>
  )
}

export default Test
