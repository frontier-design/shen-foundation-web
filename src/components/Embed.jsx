import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors, easing, duration } from '../theme.js'
import { mediaUrl } from '../content.js'
import { imageProps, SIZES } from '../images.js'
import { embedPlayerUrl } from '../embedUrl.js'
import { embedInfo } from '../embeds.js'

const Frame = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: ${colors.black};

  iframe,
  button,
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  img {
    display: block;
    object-fit: cover;
  }
`

const PlayButton = styled.button`
  display: block;
  padding: 0;
  margin: 0;
  background: none;
  cursor: pointer;
  color: ${colors.white};

  &:focus-visible {
    outline: 2px solid ${colors.white};
    outline-offset: -6px;
  }
`

const PlayIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(56px, 6vw, 88px);
  aspect-ratio: 1;
  border-radius: 50%;
  background-color: rgba(18, 18, 18, 0.55);
  transform: translate(-50%, -50%);
  transition: transform ${duration.fast}s ${easing.reveal}, background-color ${duration.fast}s ${easing.reveal};

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 54%;
    border-style: solid;
    border-width: 0.6em 0 0.6em 1em;
    border-color: transparent transparent transparent currentColor;
    font-size: clamp(14px, 1.4vw, 20px);
    transform: translate(-50%, -50%);
  }

  ${PlayButton}:hover & {
    background-color: rgba(18, 18, 18, 0.75);
    transform: translate(-50%, -50%) scale(1.06);
  }
`

// A YouTube/Vimeo video that loads nothing from the provider until it's played.
function Embed({ url, thumbnail, title, sizes = SIZES.card, className }) {
  const [playing, setPlaying] = useState(false)
  const frameRef = useRef(null)
  const info = embedInfo(url)

  useEffect(() => {
    if (playing) frameRef.current?.focus()
  }, [playing])

  if (!info) return null

  const poster = mediaUrl(thumbnail) || info.thumbnail
  const label = title || info.title || 'video'
  const ratio = `${info.width} / ${info.height}`

  return (
    <Frame className={className} style={{ aspectRatio: ratio }}>
      {playing ? (
        <iframe
          ref={frameRef}
          src={embedPlayerUrl(info.embed)}
          title={label}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <PlayButton type="button" aria-label={`Play video: ${label}`} onClick={() => setPlaying(true)}>
          {poster ? <img {...imageProps(poster, sizes)} alt="" /> : null}
          <PlayIcon aria-hidden="true" />
        </PlayButton>
      )}
    </Frame>
  )
}

export default Embed
