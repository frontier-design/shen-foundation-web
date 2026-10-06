import { useEffect, useRef } from 'react'
import { useMediaQuery } from '../grid'
import { imageProps, imageUrl, isVideo, videoProps } from '../images.js'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function Video({ src, poster, width, height, play, alt, className, style }) {
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return undefined
    video.muted = true
    if (!play) {
      video.pause()
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    })
    observer.observe(video)
    return () => observer.disconnect()
  }, [src, play])

  return (
    <video
      ref={ref}
      className={className}
      style={width && height ? { aspectRatio: `${width} / ${height}`, ...style } : style}
      src={poster ? src : `${src}#t=0.001`}
      poster={poster}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
    />
  )
}

// An image, or a muted looping video with that image as its poster. Videos play
// only while on screen; with reduced motion the image is shown instead.
function Media({ image, video, sizes, alt = '', posterWidth, className, style, ...rest }) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION)
  const videoSrc = isVideo(video) ? video : null

  if (videoSrc && !(reduceMotion && image)) {
    const { width, height } = videoProps(videoSrc)
    return (
      <Video
        src={videoSrc}
        poster={image ? imageUrl(image, posterWidth) : undefined}
        width={width}
        height={height}
        play={!reduceMotion}
        alt={alt}
        className={className}
        style={style}
      />
    )
  }

  if (!image) return null
  return <img {...imageProps(image, sizes)} alt={alt} className={className} style={style} {...rest} />
}

export default Media
