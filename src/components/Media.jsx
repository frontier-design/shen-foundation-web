import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useMediaQuery } from '../grid'
import { imageProps } from '../images.js'
import { embedInfo } from '../embeds.js'
import { createBackgroundPlayer } from '../backgroundPlayer.js'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const Wrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  > img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

function BackgroundVideo({ link, image, sizes, alt, className, style }) {
  const ref = useRef(null)
  const info = embedInfo(link)

  useEffect(() => {
    const container = ref.current
    const current = embedInfo(link)
    if (!container || !current) return undefined
    let player = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!player) player = createBackgroundPlayer(container, current)
          else player.play()
        } else player?.pause()
      },
      { rootMargin: '200px' },
    )
    observer.observe(container)
    return () => {
      observer.disconnect()
      player?.destroy()
    }
  }, [link])

  const poster = image || info.thumbnail
  return (
    <Wrap ref={ref} className={className} style={style} {...(alt ? { role: 'img', 'aria-label': alt } : {})}>
      {poster ? <img {...imageProps(poster, sizes)} alt="" /> : null}
    </Wrap>
  )
}

// An image, or a muted looping YouTube/Vimeo video over that image. Videos load
// when near the screen and pause off screen; with reduced motion only the image
// (or the video's thumbnail) is shown.
function Media({ image, video, sizes, alt = '', className, style, ...rest }) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION)
  const info = video ? embedInfo(video) : null

  if (info && !reduceMotion) {
    return <BackgroundVideo link={video} image={image} sizes={sizes} alt={alt} className={className} style={style} />
  }

  const poster = image || info?.thumbnail
  if (!poster) return null
  return <img {...imageProps(poster, sizes)} alt={alt} className={className} style={style} {...rest} />
}

export default Media
