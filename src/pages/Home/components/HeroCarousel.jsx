import { useEffect, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useMediaQuery } from '../../../grid/index.js'

const kenBurns = keyframes`
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
`

const Hero = styled.section`
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: #111;
`

const Slide = styled.div`
  position: absolute;
  inset: 0;
  opacity: ${(props) => (props.$active ? 1 : 0)};
  transition: opacity ${(props) => (props.$instant ? '0s' : '1.4s')} ease;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    ${(props) =>
      props.$active && !props.$instant
        ? css`
            animation: ${kenBurns} 8s ease-out forwards;
          `
        : css`
            transform: scale(1);
          `}
  }
`

const HOLD_MS = 5500

function HeroCarousel({ images = [] }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [index, setIndex] = useState(0)
  const slideCount = images.length
  const activeIndex = slideCount ? index % slideCount : 0

  useEffect(() => {
    if (slideCount < 2 || reduceMotion) return undefined

    let intervalId

    const start = () => {
      intervalId = window.setInterval(() => {
        setIndex((current) => current + 1)
      }, HOLD_MS)
    }

    const stop = () => window.clearInterval(intervalId)

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [slideCount, reduceMotion])

  if (!slideCount) return <Hero aria-hidden="true" />

  return (
    <Hero aria-roledescription="carousel" aria-label="Homepage images">
      {images.map((src, i) => (
        <Slide
          key={src}
          $active={i === activeIndex}
          $instant={reduceMotion}
          aria-hidden={i !== activeIndex}
        >
          <img src={src} alt="" />
        </Slide>
      ))}
    </Hero>
  )
}

export default HeroCarousel
