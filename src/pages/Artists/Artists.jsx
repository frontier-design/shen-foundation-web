import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type } from '../../theme.js'
import { getPage, mediaUrl } from '../../content.js'

const ScreenReaderTitle = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

const bleed = (side, padding) =>
  side === 'right'
    ? css`
        width: calc(100% + ${padding}px);
        margin-right: -${padding}px;
      `
    : css`
        width: calc(100% + ${padding}px);
        margin-left: -${padding}px;
      `

const Section = styled(Grid).attrs({ as: 'section' })`
  row-gap: clamp(96px, 12vw, 200px);
  padding-top: 0;
  padding-bottom: clamp(64px, 10vh, 160px);

  @media ${GRID.MEDIA_MOBILE} {
    row-gap: clamp(72px, 18vw, 120px);
  }
`

const Item = styled(GridCell).attrs({ as: 'article' })``

const CardLink = styled.a`
  display: block;
  color: inherit;
  text-decoration: none;
`

const Media = styled.div`
  aspect-ratio: 4 / 3;
  overflow: hidden;

  ${(props) => bleed(props.$side, GRID.PADDING)}

  @media ${GRID.MEDIA_TABLET} {
    ${(props) => bleed(props.$side, GRID.PADDING_TABLET)}
  }

  @media ${GRID.MEDIA_MOBILE} {
    width: calc(100% + ${GRID.PADDING_MOBILE * 2}px);
    margin-left: -${GRID.PADDING_MOBILE}px;
    margin-right: -${GRID.PADDING_MOBILE}px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Name = styled.h2`
  ${type.gridTitle}
  color: ${colors.black};
  margin-top: 24px;
  text-wrap: balance;

  @media ${GRID.MEDIA_MOBILE} {
    ${type.displayLarge}
  }
`

function ArtistItem({ item, index }) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const src = mediaUrl(item?.image)

  const placement =
    side === 'left'
      ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4 }
      : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4 }

  return (
    <Item {...placement}>
      <CardLink href="#">
        {src ? (
          <Media $side={side}>
            <img src={src} alt={item?.title || ''} />
          </Media>
        ) : null}
        {item?.title ? <Name>{item.title}</Name> : null}
      </CardLink>
    </Item>
  )
}

function Artists() {
  const page = getPage('artists')

  if (!page) return null

  const artists = page.artists || []

  return (
    <main>
      <ScreenReaderTitle>{page.title}</ScreenReaderTitle>
      {artists.length > 0 ? (
        <Section data-nav-tone-left="dark" data-nav-tone-right="dark">
          {artists.map((item, index) => (
            <ArtistItem key={index} item={item} index={index} />
          ))}
        </Section>
      ) : null}
    </main>
  )
}

export default Artists