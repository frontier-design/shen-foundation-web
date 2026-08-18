import styled from 'styled-components'
import { getExhibition, mediaUrl } from '../../content.js'

const FullBleed = styled.div`
  width: 100vw;
  height: 100vh;
  height: 100dvh;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

function Exhibition({ slug }) {
  const item = getExhibition(slug)

  if (!item) return null

  const src = mediaUrl(item.image)

  return (
    <main>
      <FullBleed>{src ? <img src={src} alt={item.title || ''} /> : null}</FullBleed>
    </main>
  )
}

export default Exhibition
