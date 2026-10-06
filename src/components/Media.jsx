import { useEffect, useRef } from 'react'
import { useMediaQuery } from '../grid'
import { imageProps, imageUrl } from '../images.js'
import { blobVideo, playsInSmallSpot, watchVideo } from '../videos.js'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

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

// An image, or a muted looping video over that image that plays while on
// screen. With reduced motion, and in small spots (cards) for videos over
// 20 MB, only the image (or the video's first frame) is shown.
function Media({ image, video, sizes, posterWidth, small = false, alt = '', className, style, ...rest }) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION)
  const uploaded = blobVideo(video)
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

  if (!image) return null
  return <img {...imageProps(image, sizes)} alt={alt} className={className} style={style} {...rest} />
}

export default Media
