import { useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { GRID, useMediaQuery } from '../../../grid/index.js'
import { colors, easing, duration } from '../../../theme.js'
import { navigate } from '../../../router.jsx'
import { imageProps, SIZES } from '../../../images.js'
import { embedInfo } from '../../../embeds.js'
import { createBackgroundPlayer } from '../../../backgroundPlayer.js'
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

  img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    object-fit: cover;
    object-position: center;
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
  const signature = slides.map((s) => `${s.image || ''}>${s.video || ''}`).join('>>')

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
      ? signature.split('>>').map((entry) => {
          const [image, link] = entry.split('>')
          const info = link ? embedInfo(link) : null
          return { image: image || info?.thumbnail || null, video: reduceMotion ? null : info }
        })
      : []
    const n = list.length

    if (!section || !layerA || !layerB || n === 0) return undefined

    let inView = true
    const players = new Map()
    const playing = new Set()

    const play = (layer) => {
      const video = list[layerIndexRef.current.get(layer)]?.video
      if (!video) return
      playing.add(layer)
      if (!inView || document.hidden) return
      const player = players.get(layer)
      if (player) player.play()
      else players.set(layer, createBackgroundPlayer(layer, video))
    }

    const stop = (layer) => {
      playing.delete(layer)
      players.get(layer)?.pause()
    }

    const show = (layer, i) => {
      const { image } = list[i]
      const img = layer.querySelector('img')
      stop(layer)
      players.get(layer)?.destroy()
      players.delete(layer)
      layerIndexRef.current.set(layer, i)
      if (image) {
        const { srcSet, src } = imageProps(image, SIZES.fullBleed)
        if (srcSet) img.srcset = srcSet
        else img.removeAttribute('srcset')
        img.src = src
      } else {
        img.removeAttribute('srcset')
        img.removeAttribute('src')
      }
    }

    const resumeAll = () => {
      for (const layer of playing) {
        if (inView && !document.hidden) play(layer)
        else players.get(layer)?.pause()
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
      resumeAll()
    })
    observer.observe(section)

    show(layerA, 0)
    play(layerA)
    setCurrent(0)

    if (n < 2 || reduceMotion) {
      gsap.set(layerB, { clipPath: 'inset(0 0 0 100%)' })
      return () => {
        observer.disconnect()
        for (const player of players.values()) player.destroy()
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
      resumeAll()
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      startUnsub()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const player of players.values()) player.destroy()
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
        <img {...imageProps(slides[0].image || embedInfo(slides[0].video)?.thumbnail, SIZES.fullBleed)} alt="" />
      </Layer>
      <Layer ref={layerBRef}>
        <img sizes={SIZES.fullBleed} alt="" />
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
