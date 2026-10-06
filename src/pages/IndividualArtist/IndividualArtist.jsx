import { useEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID, useMediaQuery } from '../../grid'
import { colors, type, easing, duration, aspect } from '../../theme.js'
import { getArtist, mediaUrl, accentImage, artistExhibitions, exhibitionSlug, toPlainText } from '../../content.js'
import RichText from '../../components/RichText.jsx'
import { useImageAccent } from '../../hooks/useImageAccent.js'
import { useScrollColumn } from '../../hooks/useScrollColumn.js'
import { linkProps } from '../../router.jsx'
import { SIZES } from '../../images.js'
import { blobVideo } from '../../videos.js'
import Media from '../../components/Media.jsx'
import BackButton from '../../components/BackButton.jsx'

const Section = styled.main`
  width: 100%;
`

const Layout = styled(Grid)`
  height: 100vh;
  height: 100dvh;
  align-items: stretch;
  row-gap: 0;

  @media ${GRID.MEDIA_TABLET} {
    height: auto;
    align-items: start;
    row-gap: clamp(32px, 8vw, 48px);
  }
`

const NAME_TOP = 'clamp(96px, 12vh, 180px)'
const FADE = '96px'
const FIVE_COLUMNS = `calc((min(${GRID.MAX_WIDTH}px, 100vw) - ${2 * GRID.PADDING + 11 * GRID.GAP}px) / 12 * 5 + ${4 * GRID.GAP}px)`

const column = css`
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 1px solid ${colors.gray};
    outline-offset: -1px;
  }
`

// The bio scrolls in its own column on desktop. Text fades out under the nav
// logo, and a soft fade at the bottom edge shows that more text follows.
const Left = styled(GridCell)`
  ${column}
  margin-left: -${GRID.PADDING}px;
  padding-left: ${GRID.PADDING}px;
  --fade-bottom: #000;
  -webkit-mask-image: linear-gradient(to bottom, transparent 84px, #000 calc(${NAME_TOP} + 32px), #000 calc(100% - ${FADE}), var(--fade-bottom));
  mask-image: linear-gradient(to bottom, transparent 84px, #000 calc(${NAME_TOP} + 32px), #000 calc(100% - ${FADE}), var(--fade-bottom));

  &[data-more='below'],
  &[data-more='both'] {
    --fade-bottom: transparent;
  }

  @media ${GRID.MEDIA_TABLET} {
    height: auto;
    overflow: visible;
    margin-left: 0;
    padding-left: 0;
    -webkit-mask-image: none;
    mask-image: none;
  }
`

// First screen: the name centred above the bio, the bio ending at the bottom.
// A long bio starts no higher than 60% down the first screen and continues
// below the fold.
const LeftContent = styled.div`
  display: grid;
  grid-template-rows: minmax(calc(60dvh - ${NAME_TOP}), 1fr) auto;
  min-height: 100%;
  max-width: ${FIVE_COLUMNS};
  padding-top: ${NAME_TOP};
  padding-bottom: clamp(24px, 3vw, 40px);

  @media ${GRID.MEDIA_TABLET} {
    grid-template-rows: auto auto;
    max-width: none;
    padding-top: 0;
    padding-bottom: 0;
    row-gap: clamp(32px, 8vw, 48px);
  }
`

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  align-self: center;
`

const Name = styled.h1`
  ${type.gridTitle}
  color: ${colors.black};
  margin: 0;

  @media ${GRID.MEDIA_MOBILE} {
    ${type.displayLarge}
    text-wrap: wrap;
  }
`

const Bio = styled(RichText)`
  ${type.body}
  color: ${colors.black};
  margin: 0;
  text-wrap: pretty;

  @media ${GRID.MEDIA_MOBILE} {
    margin-bottom: clamp(18px, 5.6vw, 31.5px);
  }
`

const Right = styled(GridCell)`
  ${column}
  margin-right: -${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    display: contents;
  }
`

const Feed = styled.div`
  display: flex;
  flex-direction: column;

  @media ${GRID.MEDIA_TABLET} {
    display: contents;
  }
`

// Stacked (tablet/mobile): the portrait goes above the name and bio, the
// related exhibitions below them.
const stackedBlock = (order) => css`
  @media ${GRID.MEDIA_TABLET} {
    order: ${order};
    grid-column: 1 / -1;
    margin: 0 -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    margin: 0 -${GRID.PADDING_MOBILE}px;
  }
`

const Portrait = styled.div`
  ${stackedBlock(-1)}
`

const Works = styled.div`
  display: flex;
  flex-direction: column;
  ${stackedBlock(1)}
`

const FeedImage = styled.div`
  width: 100%;
  overflow: hidden;
  background-color: ${colors.gray};

  ${(props) =>
    props.$fill
      ? css`
          height: 100vh;
          height: 100dvh;

          @media ${GRID.MEDIA_MOBILE} {
            height: 50vh;
            height: 50dvh;
          }
        `
      : css`
          aspect-ratio: ${aspect.landscape};
        `}

  img,
  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  padding: clamp(20px, 2.5vw, 33px) ${GRID.PADDING}px clamp(40px, 5vw, 72px) 0;

  @media ${GRID.MEDIA_TABLET} {
    padding-left: ${GRID.PADDING_TABLET}px;
    padding-right: ${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    padding-left: ${GRID.PADDING_MOBILE}px;
    padding-right: ${GRID.PADDING_MOBILE}px;
  }
`

const WorkTitle = styled.p`
  ${type.titleLarge}
  color: ${(props) => props.$color || colors.accent};
  margin: 0;
  transition: color ${duration.base}s ${easing.reveal};
`

const MetaLabel = styled.p`
  ${type.caption}
  color: ${colors.gray};
  margin: clamp(12px, 1.4vw, 16px) 0 0;
`

const MetaLine = styled.p`
  ${type.caption}
  color: ${colors.black};
  margin: 0;
`

const CardLink = styled.a`
  display: block;
  color: inherit;
  text-decoration: none;
`

function ExhibitionEntry({ item }) {
  const src = mediaUrl(item.heroImage)
  const video = blobVideo(item.heroVideo)?.src
  const accent = useImageAccent(accentImage(item), colors.gray)

  return (
    <CardLink {...linkProps(`/exhibitions/${exhibitionSlug(item)}`)}>
      {src || video ? (
        <FeedImage>
          <Media image={src} video={video} sizes={SIZES.card} posterWidth={1280} small alt={item.subtitle || ''} />
        </FeedImage>
      ) : null}
      <Meta>
        {item.subtitle ? <WorkTitle $color={accent}>{item.subtitle}</WorkTitle> : null}
        <MetaLabel>Exhibition</MetaLabel>
        {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
        {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
      </Meta>
    </CardLink>
  )
}

const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'])
const LINE = 40

// With nothing focused, scrolling keys move the right column (the default one);
// a focused column scrolls itself natively.
function useDefaultKeyboardColumn(ref, enabled) {
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      const panel = ref.current
      const idle = e.target === document.body || e.target === document.documentElement
      if (!panel || !idle || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !SCROLL_KEYS.has(e.key)) return
      const page = panel.clientHeight * 0.9
      const deltas = { ' ': e.shiftKey ? -page : page, PageDown: page, PageUp: -page, ArrowDown: LINE, ArrowUp: -LINE }
      e.preventDefault()
      if (e.key === 'Home') panel.scrollTo({ top: 0 })
      else if (e.key === 'End') panel.scrollTo({ top: panel.scrollHeight })
      else panel.scrollBy({ top: deltas[e.key], behavior: e.key.startsWith('Arrow') ? 'auto' : 'smooth' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ref, enabled])
}

function IndividualArtist({ slug }) {
  const item = getArtist(slug)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const stacked = useMediaQuery(GRID.MEDIA_TABLET)
  useScrollColumn(leftRef, 'artist-left')
  useScrollColumn(rightRef, 'artist-right')
  useDefaultKeyboardColumn(rightRef, !stacked)

  if (!item) return null

  const thumbnail = mediaUrl(item.thumbnail)
  const thumbnailVideo = mediaUrl(item.thumbnailVideo)
  const shows = artistExhibitions(item)

  return (
    <Section data-nav-tone-left="light" data-nav-tone-right="dark">
      <Layout>
        <Left
          ref={leftRef}
          $start={1}
          $span={6}
          $startTablet={1}
          $spanTablet={8}
          data-artist-column="left"
          {...(stacked ? {} : { tabIndex: 0, 'aria-label': item.title ? `About ${item.title}` : 'About the artist' })}
        >
          <LeftContent>
            <Heading>
              <BackButton fallback="/artists" />
              {item.title ? <Name>{item.title}</Name> : null}
            </Heading>
            {toPlainText(item.bio) ? <Bio html={item.bio} /> : null}
          </LeftContent>
        </Left>

        <Right
          ref={rightRef}
          $start={7}
          $end={-1}
          $startTablet={1}
          $spanTablet={8}
          data-artist-column="right"
          {...(stacked ? {} : { tabIndex: 0, 'aria-label': 'Portrait and exhibitions' })}
        >
          <Feed>
            {thumbnail || thumbnailVideo ? (
              <Portrait>
                <FeedImage $fill>
                  <Media image={thumbnail} video={thumbnailVideo} sizes={SIZES.halfTall} alt="" />
                </FeedImage>
              </Portrait>
            ) : null}
            {shows.length > 0 ? (
              <Works>
                {shows.map((ex) => (
                  <ExhibitionEntry key={exhibitionSlug(ex)} item={ex} />
                ))}
              </Works>
            ) : null}
          </Feed>
        </Right>
      </Layout>
    </Section>
  )
}

export default IndividualArtist
