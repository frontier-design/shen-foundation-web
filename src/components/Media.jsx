import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useMediaQuery } from '../grid'
import { imageProps, imageUrl } from '../images.js'
import { embedInfo } from '../embeds.js'
import { createBackgroundPlayer } from '../backgroundPlayer.js'
import { blobVideo, playsInSmallSpot, watchVideo } from '../videos.js'

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

function NativeVideo({ video, poster, play, alt, className, style }) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !play) return undefined
    element.muted = true
    return watchVideo(element)
  }, [video.src, play])

  return (
    <video
      ref={ref}
      className={className}
      style={style}
      src={poster ? video.src : `${video.src}#t=0.001`}
      poster={poster}
      width={video.width}
      height={video.height}
      muted
      loop
      playsInline
      crossOrigin="anonymous"
      preload={poster ? 'none' : 'metadata'}
      disablePictureInPicture
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
    />
  )
}

// An image, or a muted looping video over that image. Uploaded videos play
// natively while on screen; YouTube/Vimeo links use the background player.
// With reduced motion, and in small spots (cards) for videos over 20 MB, only
// the image (or the video's first frame) is shown.
function Media({ image, video, sizes, posterWidth, small = false, alt = '', className, style, ...rest }) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION)
  const uploaded = blobVideo(video)
  const info = !uploaded && video ? embedInfo(video) : null
  const play = !reduceMotion && !(small && !playsInSmallSpot(uploaded))

  if (uploaded && (play || !image)) {
    return (
      <NativeVideo
        video={uploaded}
        poster={image ? imageUrl(image, posterWidth) : undefined}
        play={play}
        alt={alt}
        className={className}
        style={style}
      />
    )
  }

  if (info && !reduceMotion) {
    return <BackgroundVideo link={video} image={image} sizes={sizes} alt={alt} className={className} style={style} />
  }

  const poster = image || info?.thumbnail
  if (!poster) return null
  return <img {...imageProps(poster, sizes)} alt={alt} className={className} style={style} {...rest} />
}

export default Media
