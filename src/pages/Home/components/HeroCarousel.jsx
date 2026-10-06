import { useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { GRID, useMediaQuery } from '../../../grid/index.js'
import { colors, easing, duration } from '../../../theme.js'
import { navigate } from '../../../router.jsx'
import { imageProps, imageUrl, SIZES } from '../../../images.js'
import { isLoadingDone, onLoadingDone } from '../../../loading.js'

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

const Layer = styled.div`
  position: absolute;
  inset: 0;
  will-change: clip-path;

  img,
  video {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    object-fit: cover;
    object-position: center;
  }

  video {
    visibility: hidden;
  }
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

const HOLD_BEFORE = 4.5
const WIPE = duration.slow
const HOLD_HALF = 1.6
const HOLD_FULL = 4.5

function HeroCarousel({ slides = [] }) {
  const sectionRef = useRef(null)
  const layerARef = useRef(null)
  const layerBRef = useRef(null)
  const linkRef = useRef(null)
  const layerIndexRef = useRef(new Map())
  const currentRef = useRef(0)
  const slidesRef = useRef(slides)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const signature = slides.map((s) => `${s.image || ''}>${s.video || ''}`).join('|')

  useEffect(() => {
    slidesRef.current = slides
  })

  const go = (idx) => {
    const to = slidesRef.current[idx]?.link
    if (to) navigate(to)
  }

  // Navigate to whichever slide is actually under the cursor, so the two
  // halves of the split each lead to their own exhibition.
  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const layer = [layerARef.current, layerBRef.current].find((el) => el?.contains(e.target))
    go(layer ? layerIndexRef.current.get(layer) ?? currentRef.current : currentRef.current)
  }

  const handleLinkClick = (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(currentRef.current)
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    const layerA = layerARef.current
    const layerB = layerBRef.current
    const list = signature
      ? signature.split('|').map((entry) => {
          const [image, video] = entry.split('>')
          return { image: image || null, video: (!reduceMotion && video) || null }
        })
      : []
    const n = list.length

    if (!section || !layerA || !layerB || n === 0) return undefined

    let inView = true
    const playing = new Set()

    const videoOf = (layer) => layer.querySelector('video')

    const play = (layer) => {
      const video = videoOf(layer)
      if (!video.getAttribute('src')) return
      playing.add(layer)
      if (inView && !document.hidden) video.play().catch(() => {})
    }

    const stop = (layer) => {
      playing.delete(layer)
      videoOf(layer).pause()
    }

    const show = (layer, i) => {
      const { image, video: videoSrc } = list[i]
      const img = layer.querySelector('img')
      const video = videoOf(layer)
      layerIndexRef.current.set(layer, i)
      stop(layer)
      if (image) {
        const { srcSet, src } = imageProps(image, SIZES.fullBleed)
        if (srcSet) img.srcset = srcSet
        else img.removeAttribute('srcset')
        img.src = src
      } else {
        img.removeAttribute('srcset')
        img.removeAttribute('src')
      }
      if (videoSrc) {
        video.muted = true
        if (image) video.poster = imageUrl(image)
        else video.removeAttribute('poster')
        if (video.getAttribute('src') !== videoSrc) video.src = videoSrc
        video.currentTime = 0
        video.style.visibility = 'visible'
      } else if (video.getAttribute('src')) {
        video.removeAttribute('src')
        video.removeAttribute('poster')
        video.load()
        video.style.visibility = ''
      }
    }

    const setCurrent = (i) => {
      currentRef.current = i
      const link = linkRef.current
      const slide = slidesRef.current[i]
      if (link && slide) {
        link.href = slide.link
        link.setAttribute('aria-label', slide.title ? `View ${slide.title}` : 'View exhibition')
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      for (const layer of playing) {
        if (inView && !document.hidden) videoOf(layer).play().catch(() => {})
        else videoOf(layer).pause()
      }
    })
    observer.observe(section)

    show(layerA, 0)
    play(layerA)
    setCurrent(0)

    if (n < 2 || reduceMotion) {
      gsap.set(layerB, { clipPath: 'inset(0 0 0 100%)' })
      return () => {
        observer.disconnect()
        stop(layerA)
      }
    }

    let current = 0
    let bottom = layerA
    let top = layerB
    let tl
    let cancelled = false
    let startUnsub = () => {}

    const ctx = gsap.context(() => {
      gsap.set(layerA, { zIndex: 1 })
      gsap.set(layerB, { zIndex: 2, clipPath: 'inset(0 0 0 100%)' })

      // The layers swap roles each cycle, so the slide on screen is never reloaded
      // and a playing video carries on through the next wipe.
      const step = () => {
        if (cancelled) return
        const next = (current + 1) % n
        const incoming = top

        show(incoming, next)
        gsap.set(incoming, { zIndex: 2, clipPath: 'inset(0 0 0 100%)' })
        gsap.set(bottom, { zIndex: 1 })

        tl = gsap.timeline({
          onComplete: () => {
            if (cancelled) return
            stop(bottom)
            top = bottom
            bottom = incoming
            current = next
            step()
          },
        })

        tl.add(() => play(incoming), HOLD_BEFORE)
          .to(incoming, {
            clipPath: `inset(0 0 0 calc(50% + ${GRID.GAP / 2}px))`,
            duration: WIPE,
            ease: 'reveal',
          })
          .to({}, { duration: HOLD_HALF })
          .to(incoming, { clipPath: 'inset(0 0 0 0%)', duration: WIPE, ease: 'reveal' })
          .add(() => setCurrent(next))
          .to({}, { duration: HOLD_FULL })
      }

      const start = () => {
        if (!cancelled) step()
      }
      if (isLoadingDone()) start()
      else startUnsub = onLoadingDone(start)
    }, section)

    const onVisibility = () => {
      if (document.hidden) tl?.pause()
      else tl?.resume()
      for (const layer of playing) {
        if (inView && !document.hidden) videoOf(layer).play().catch(() => {})
        else videoOf(layer).pause()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      startUnsub()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      stop(layerA)
      stop(layerB)
      ctx.revert()
    }
  }, [signature, reduceMotion])

  if (!slides.length) return <HeroSection aria-hidden="true" />

  return (
    <HeroSection
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured exhibitions"
      onClick={handleClick}
    >
      <Layer ref={layerARef}>
        <img {...imageProps(slides[0].image, SIZES.fullBleed)} alt="" />
        <video muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" />
      </Layer>
      <Layer ref={layerBRef}>
        <img sizes={SIZES.fullBleed} alt="" />
        <video muted loop playsInline preload="auto" disablePictureInPicture aria-hidden="true" />
      </Layer>
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
