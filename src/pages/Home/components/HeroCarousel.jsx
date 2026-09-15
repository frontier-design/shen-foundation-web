import { useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { GRID, useMediaQuery } from '../../../grid/index.js'
import { colors, easing, duration } from '../../../theme.js'
import { navigate } from '../../../router.jsx'

gsap.registerPlugin(CustomEase)

CustomEase.create('reveal', easing.gsapReveal)

const HeroSection = styled.section`
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  height: 100svh;
  background-color: ${colors.black};
  overflow: hidden;
  cursor: pointer;

  @media ${GRID.MEDIA_MOBILE} {
    height: 100svh;
    height: 100dvh;
  }
`

const Layer = styled.img`
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  object-fit: cover;
  object-position: center;
  will-change: clip-path;
`

const HiddenLink = styled.a`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
`

const HOLD_BEFORE = 2.5
const WIPE = duration.slow
const HOLD_HALF = 1.6
const HOLD_FULL = 2.5

function HeroCarousel({ slides = [] }) {
  const sectionRef = useRef(null)
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const linkRef = useRef(null)
  const backIndexRef = useRef(0)
  const frontIndexRef = useRef(0)
  const currentRef = useRef(0)
  const slidesRef = useRef(slides)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const images = slides.map((s) => s.image)
  const signature = images.join('|')

  useEffect(() => {
    slidesRef.current = slides
  })

  const go = (idx) => {
    const to = slidesRef.current[idx]?.link
    if (to) navigate(to)
  }

  // Navigate to whichever image is actually under the cursor, so the two
  // halves of the split each lead to their own exhibition.
  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const idx = e.target === frontRef.current ? frontIndexRef.current : backIndexRef.current
    go(idx)
  }

  const handleLinkClick = (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(currentRef.current)
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    const back = backRef.current
    const front = frontRef.current
    const srcs = signature ? signature.split('|') : []
    const n = srcs.length

    if (!section || !back || !front || n === 0) return undefined

    const setCurrent = (i) => {
      currentRef.current = i
      const link = linkRef.current
      const slide = slidesRef.current[i]
      if (link && slide) {
        link.href = slide.link
        link.setAttribute('aria-label', slide.title ? `View ${slide.title}` : 'View exhibition')
      }
    }

    back.src = srcs[0]
    backIndexRef.current = 0
    frontIndexRef.current = 0
    setCurrent(0)

    if (n < 2 || reduceMotion) {
      gsap.set(front, { clipPath: 'inset(0 0 0 100%)' })
      return undefined
    }

    let current = 0
    let tl
    let cancelled = false

    const ctx = gsap.context(() => {
      gsap.set(front, { clipPath: 'inset(0 0 0 100%)' })

      const step = () => {
        if (cancelled) return
        const next = (current + 1) % n

        back.src = srcs[current]
        backIndexRef.current = current
        front.src = srcs[next]
        frontIndexRef.current = next
        gsap.set(front, { clipPath: 'inset(0 0 0 100%)' })

        tl = gsap.timeline({
          onComplete: () => {
            if (cancelled) return
            current = next
            step()
          },
        })

        tl.set({}, {}, HOLD_BEFORE)
          .to(front, {
            clipPath: `inset(0 0 0 calc(50% + ${GRID.GAP / 2}px))`,
            duration: WIPE,
            ease: 'reveal',
          })
          .to({}, { duration: HOLD_HALF })
          .to(front, { clipPath: 'inset(0 0 0 0%)', duration: WIPE, ease: 'reveal' })
          .add(() => setCurrent(next))
          .to({}, { duration: HOLD_FULL })
      }

      step()
    }, section)

    const onVisibility = () => {
      if (!tl) return
      if (document.hidden) tl.pause()
      else tl.resume()
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      ctx.revert()
    }
  }, [signature, reduceMotion])

  if (!images.length) return <HeroSection aria-hidden="true" />

  return (
    <HeroSection
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured exhibitions"
      onClick={handleClick}
    >
      <Layer ref={backRef} src={images[0]} alt="" />
      <Layer ref={frontRef} alt="" />
      <HiddenLink
        ref={linkRef}
        href={slides[0]?.link}
        onClick={handleLinkClick}
        aria-label={slides[0]?.title ? `View ${slides[0].title}` : 'View exhibition'}
      />
    </HeroSection>
  )
}

export default HeroCarousel
