import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { GRID, useMediaQuery } from '../../../grid/index.js'

gsap.registerPlugin(CustomEase)

CustomEase.create('reveal', 'M0,0 C0.16,1 0.3,1 1,1')

const HeroSection = styled.section`
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  height: 100svh;
  background-color: #f0f0f0;
  overflow: hidden;

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

const HOLD_BEFORE = 2.5
const WIPE = 0.9
const HOLD_HALF = 1.6
const HOLD_FULL = 2.5

const SAMPLE = 24
const LUMA_THRESHOLD = 140

function cornerLuminance(img, side) {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const cropW = Math.max(1, Math.round(w * 0.25))
  const cropH = Math.max(1, Math.round(h * 0.25))
  const sx = side === 'left' ? 0 : w - cropW

  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, sx, 0, cropW, cropH, 0, 0, SAMPLE, SAMPLE)

  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  return sum / (data.length / 4)
}

const toneFromLuminance = (luma) => (luma > LUMA_THRESHOLD ? 'light' : 'dark')

function HeroCarousel({ images = [] }) {
  const sectionRef = useRef(null)
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const signature = images.join('|')

  useLayoutEffect(() => {
    const section = sectionRef.current
    const back = backRef.current
    const front = frontRef.current
    const slides = signature ? signature.split('|') : []
    const n = slides.length

    if (!section || !back || !front || n === 0) return undefined

    const publish = ({ logo, plus } = {}) => {
      if (logo) section.dataset.navToneLeft = logo
      if (plus) section.dataset.navToneRight = plus
    }

    const tones = slides.map(() => ({ logo: 'dark', plus: 'dark' }))

    slides.forEach((src, i) => {
      const probe = new Image()
      if (/^https?:\/\//.test(src)) probe.crossOrigin = 'anonymous'
      probe.onload = () => {
        try {
          tones[i] = {
            logo: toneFromLuminance(cornerLuminance(probe, 'left')),
            plus: toneFromLuminance(cornerLuminance(probe, 'right')),
          }
        } catch {
          // Tainted canvas — keep the fallback.
        }
        if (i === 0) publish(tones[0])
      }
      probe.src = src
    })

    back.src = slides[0]
    publish(tones[0])

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

        back.src = slides[current]
        front.src = slides[next]
        gsap.set(front, { clipPath: 'inset(0 0 0 100%)' })

        tl = gsap.timeline({
          onComplete: () => {
            if (cancelled) return
            current = next
            step()
          },
        })

        tl.set({}, {}, HOLD_BEFORE)
          .add(() => publish({ plus: tones[next].plus }))
          .to(front, { clipPath: 'inset(0 0 0 50%)', duration: WIPE, ease: 'reveal' })
          .to({}, { duration: HOLD_HALF })
          .add(() => publish(tones[next]))
          .to(front, { clipPath: 'inset(0 0 0 0%)', duration: WIPE, ease: 'reveal' })
          .to({}, { duration: HOLD_FULL })

        publish(tones[current])
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
      aria-label="Homepage images"
      data-nav-tone-left="dark"
      data-nav-tone-right="dark"
    >
      <Layer ref={backRef} src={images[0]} alt="" />
      <Layer ref={frontRef} alt="" />
    </HeroSection>
  )
}

export default HeroCarousel
