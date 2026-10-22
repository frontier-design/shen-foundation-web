import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type } from '../../theme.js'
import { getArtist, mediaUrl, artistRelatedCards, toPlainText, focusPosition } from '../../content.js'
import RichText from '../../components/RichText.jsx'
import { SIZES } from '../../images.js'
import Media from '../../components/Media.jsx'
import BackButton from '../../components/BackButton.jsx'
import CardGrid from '../../components/CardGrid.jsx'

const NAME_TOP = 'clamp(96px, 12vh, 180px)'
const FIVE_COLUMNS = `calc((min(${GRID.MAX_WIDTH}px, 100vw) - ${2 * GRID.PADDING + 11 * GRID.GAP}px) / 12 * 5 + ${4 * GRID.GAP}px)`

const Section = styled.main`
  width: 100%;
`

// Desktop: the name and bio scroll with the page on the left while the
// portrait stays in place on the right; when the bio ends, the page moves on
// to the related exhibitions and events. Tablet/mobile: portrait, then text.
const Intro = styled(Grid)`
  align-items: start;
  row-gap: 0;

  @media ${GRID.MEDIA_TABLET} {
    row-gap: clamp(32px, 8vw, 48px);
  }
`

// First screen: the name centred above the bio, the bio ending at the bottom.
// A long bio starts no higher than 60% down the first screen and continues
// below the fold while the portrait stays.
const Text = styled(GridCell)`
  grid-row: 1;
  display: grid;
  grid-template-rows: minmax(calc(60dvh - ${NAME_TOP}), 1fr) auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: ${NAME_TOP};
  padding-bottom: clamp(40px, 5vw, 72px);

  & > * {
    max-width: ${FIVE_COLUMNS};
  }

  @media ${GRID.MEDIA_TABLET} {
    grid-row: auto;
    grid-template-rows: auto auto;
    min-height: 0;
    padding-top: 0;
    padding-bottom: clamp(32px, 8vw, 48px);
    row-gap: clamp(32px, 8vw, 48px);

    & > * {
      max-width: none;
    }
  }
`

// Desktop: the bio fades out under the nav logo while it scrolls past it
// (stays at the top of the screen only while the intro is in view).
const LogoFade = styled(GridCell)`
  grid-row: 1;
  position: sticky;
  top: 0;
  z-index: 1;
  align-self: start;
  height: calc(${NAME_TOP} + 32px);
  margin-left: -${GRID.PADDING}px;
  background: linear-gradient(to bottom, ${colors.white} 84px, transparent);
  pointer-events: none;

  @media ${GRID.MEDIA_TABLET} {
    display: none;
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
`

const Portrait = styled(GridCell)`
  grid-row: 1;
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  margin-right: -${GRID.PADDING}px;
  overflow: hidden;
  background-color: ${colors.gray};

  img,
  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media ${GRID.MEDIA_TABLET} {
    grid-row: auto;
    position: static;
    order: -1;
    margin: 0 -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    height: 50vh;
    height: 50dvh;
    margin: 0 -${GRID.PADDING_MOBILE}px;
  }
`

const Related = styled.div`
  padding-top: clamp(48px, 8vh, 120px);

  @media ${GRID.MEDIA_TABLET} {
    padding-top: 0;
  }
`

function IndividualArtist({ slug }) {
  const item = getArtist(slug)
  if (!item) return null

  const thumbnail = mediaUrl(item.thumbnail)
  const thumbnailVideo = mediaUrl(item.thumbnailVideo)
  const related = artistRelatedCards(item)

  return (
    <Section>
      <Intro data-nav-tone-left="light" data-nav-tone-right="dark">
        <LogoFade $start={1} $span={6} aria-hidden="true" />
        <Text $start={1} $span={6} $startTablet={1} $spanTablet={8} $startMobile={1} $spanMobile={4}>
          <Heading>
            <BackButton fallback="/artists" />
            {item.title ? <Name>{item.title}</Name> : null}
          </Heading>
          {toPlainText(item.bio) ? <Bio html={item.bio} /> : null}
        </Text>
        {thumbnail || thumbnailVideo ? (
          <Portrait $start={7} $end={-1} $startTablet={1} $spanTablet={8} $startMobile={1} $spanMobile={4}>
            <Media image={thumbnail} video={thumbnailVideo} focus={focusPosition(item.thumbnailFocus)} sizes={SIZES.halfTall} alt="" />
          </Portrait>
        ) : null}
      </Intro>
      {related.length > 0 ? (
        <Related>
          <CardGrid items={related} />
        </Related>
      ) : null}
    </Section>
  )
}

export default IndividualArtist
