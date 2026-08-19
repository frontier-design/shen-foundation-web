import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type, easing, duration } from '../../theme.js'
import { getExhibition, mediaUrl } from '../../content.js'
import { useImageAccent } from '../../hooks/useImageAccent.js'

const Hero = styled.div`
  width: 100%;
  height: 100vh;
  height: 100dvh;

  @media ${GRID.MEDIA_MOBILE} {
    height: 50vh;
    height: 50dvh;
  }

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

  @media ${GRID.MEDIA_MOBILE} {
    row-gap: 0;
  }
`

const Title = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
`

const Subtitle = styled.p`
  ${type.titleLarge}
  color: ${(props) => props.$color || colors.accent};
  margin: 4px 0 0;
  transition: color ${duration.base}s ${easing.reveal};
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;

  @media ${GRID.MEDIA_MOBILE} {
    margin-top: clamp(24px, 8vw, 48px);
  }
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
  ${type.body}
  color: ${colors.black};
  margin: clamp(40px, 5vw, 88px) 0 0;

  @media ${GRID.MEDIA_MOBILE} {
    margin-top: clamp(48px, 14vw, 72px);
  }
`

const ArtistLink = styled.a`
  color: inherit;
  text-decoration: underline;
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

const bleedBoth = (padding) => css`
  width: calc(100% + ${padding * 2}px);
  margin-left: -${padding}px;
  margin-right: -${padding}px;
`

const Gallery = styled(Grid).attrs({ as: 'section' })`
  align-items: start;
  row-gap: clamp(56px, 8vw, 140px);
  padding-top: clamp(72px, 12vw, 220px);
  padding-bottom: clamp(72px, 10vw, 160px);

  @media ${GRID.MEDIA_MOBILE} {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
`

const GalleryFigure = styled.figure`
  margin: 0;

  ${(props) => bleed(props.$side, GRID.PADDING)}

  @media ${GRID.MEDIA_TABLET} {
    ${(props) => bleed(props.$side, GRID.PADDING_TABLET)}
  }

  @media ${GRID.MEDIA_MOBILE} {
    ${bleedBoth(GRID.PADDING_MOBILE)}
  }

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
        <GridCell $start={1} $span={5} $startTablet={1} $spanTablet={8}>
          {item.title ? <Title>{item.title}</Title> : null}
          {item.subtitle ? <Subtitle $color={accent}>{item.subtitle}</Subtitle> : null}
        </GridCell>

        <GridCell $start={7} $span={6} $startTablet={1} $spanTablet={8}>
          <Meta>
            {item.captionLabel ? <MetaLabel>{item.captionLabel}</MetaLabel> : null}
            {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
            {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
          </Meta>
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

            const side = index % 2 === 0 ? 'left' : 'right'
            const placement =
              side === 'left'
                ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4 }
                : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4 }

            return (
              <GridCell key={index} {...placement}>
                <GalleryFigure $side={side}>
                  <img src={src} alt={entry.caption || ''} />
                  {entry.caption ? <GalleryCaption>{entry.caption}</GalleryCaption> : null}
                </GalleryFigure>
              </GridCell>
            )
          })}
        </Gallery>
      ) : null}
    </main>
  )
}

export default Exhibition
