import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, fonts, type, easing, duration } from '../../theme.js'
import { getExhibition, mediaUrl } from '../../content.js'
import { useImageAccent } from '../../hooks/useImageAccent.js'

const Hero = styled.div`
  width: 100%;
  height: 100vh;
  height: 100dvh;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Header = styled(Grid).attrs({ as: 'header' })`
  align-items: start;
  padding-top: clamp(48px, 6vw, 100px);
  row-gap: clamp(32px, 4vw, 56px);
`

const Title = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
`

const Subtitle = styled.p`
  ${type.gridSubtitle}
  color: ${(props) => props.$color || colors.accent};
  margin: 4px 0 0;
  transition: color ${duration.base}s ${easing.reveal};
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
`

const MetaLabel = styled.p`
  ${type.caption}
  color: ${colors.gray};
  margin: 0;
`

const MetaLine = styled.p`
  ${type.caption}
  color: ${colors.black};
  margin: 0;
`

const Body = styled.p`
  font-family: ${fonts.body};
  font-size: clamp(14px, 1vw, 16px);
  line-height: 1.5;
  letter-spacing: -0.02em;
  color: ${colors.black};
  margin: 0;
`

const ArtistLink = styled.a`
  color: inherit;
  text-decoration: underline;
`

const Gallery = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${GRID.GAP}px;
  row-gap: clamp(56px, 8vw, 140px);
  align-items: start;
  padding: clamp(72px, 12vw, 220px) ${GRID.PADDING}px clamp(72px, 10vw, 160px);
  max-width: ${GRID.MAX_WIDTH}px;
  margin: 0 auto;

  @media ${GRID.MEDIA_TABLET} {
    padding-left: ${GRID.PADDING_TABLET}px;
    padding-right: ${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    grid-template-columns: 1fr;
    row-gap: clamp(40px, 12vw, 72px);
    padding-left: ${GRID.PADDING_MOBILE}px;
    padding-right: ${GRID.PADDING_MOBILE}px;
  }
`

const GalleryItem = styled.figure`
  margin: 0;
  ${(props) => props.$full && 'grid-column: 1 / -1;'}

  img {
    display: block;
    width: 100%;
    height: auto;
  }
`

const GalleryCaption = styled.figcaption`
  ${type.caption}
  color: ${colors.gray};
  margin-top: 12px;
`

function Exhibition({ slug }) {
  const item = getExhibition(slug)
  const heroSrc = mediaUrl(item?.heroImage)
  const accent = useImageAccent(heroSrc, colors.gray)

  if (!item) return null

  const gallery = item.gallery || []

  return (
    <main>
      {heroSrc ? (
        <Hero data-nav-tone-left="dark" data-nav-tone-right="dark">
          <img src={heroSrc} alt={item.title || ''} />
        </Hero>
      ) : null}

      <Header>
        <GridCell $start={1} $span={6} $startTablet={1} $spanTablet={8}>
          {item.title ? <Title>{item.title}</Title> : null}
          {item.subtitle ? <Subtitle $color={accent}>{item.subtitle}</Subtitle> : null}
        </GridCell>

        <GridCell $start={7} $span={2} $startTablet={1} $spanTablet={3}>
          <Meta>
            {item.captionLabel ? <MetaLabel>{item.captionLabel}</MetaLabel> : null}
            {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
            {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
          </Meta>
        </GridCell>

        <GridCell $start={9} $span={4} $startTablet={4} $spanTablet={5}>
          {item.body ? (
            <Body>
              {item.body}
              {item.artistLinkUrl && item.artistLinkLabel ? (
                <>
                  {' '}
                  <ArtistLink href={item.artistLinkUrl}>{item.artistLinkLabel} →</ArtistLink>
                </>
              ) : null}
            </Body>
          ) : null}
        </GridCell>
      </Header>

      {gallery.length > 0 ? (
        <Gallery>
          {gallery.map((entry, index) => {
            const src = mediaUrl(entry.image)
            if (!src) return null
            return (
              <GalleryItem key={index} $full={entry.fullWidth}>
                <img src={src} alt={entry.caption || ''} />
                {entry.caption ? <GalleryCaption>{entry.caption}</GalleryCaption> : null}
              </GalleryItem>
            )
          })}
        </Gallery>
      ) : null}
    </main>
  )
}

export default Exhibition
