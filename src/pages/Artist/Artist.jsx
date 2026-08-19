import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type, easing, duration } from '../../theme.js'
import { getArtist, mediaUrl } from '../../content.js'
import { useImageAccent } from '../../hooks/useImageAccent.js'

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

const Left = styled(GridCell)`
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  min-height: 0;
  padding-top: clamp(96px, 12vh, 180px);
  padding-bottom: clamp(24px, 3vw, 40px);

  @media ${GRID.MEDIA_TABLET} {
    height: auto;
    grid-template-rows: auto auto;
    padding-top: clamp(96px, 14vh, 140px);
    padding-bottom: 0;
    row-gap: clamp(32px, 8vw, 48px);
  }
`

const Name = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
  align-self: center;
  text-align: left;
`

const Bio = styled.p`
  ${type.gridSubtitle}
  font-size: clamp(20px, 1.5vw, 28px);
  color: ${colors.black};
  line-height: 1.5;
  margin: 0;
  white-space: pre-line;
`

const Right = styled(GridCell)`
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  margin-right: -${GRID.PADDING}px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media ${GRID.MEDIA_TABLET} {
    height: auto;
    overflow: visible;
    margin: 0 -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    margin: 0 -${GRID.PADDING_MOBILE}px;
  }
`

const Feed = styled.div`
  display: flex;
  flex-direction: column;
`

const FeedImage = styled.div`
  width: 100%;
  overflow: hidden;
  background-color: ${colors.gray};

  ${(props) =>
    props.$fill &&
    css`
      min-height: 100%;
      min-height: 100dvh;

      @media ${GRID.MEDIA_TABLET} {
        min-height: 50vh;
        min-height: 50dvh;
      }
    `}

  img {
    display: block;
    width: 100%;
    height: ${(props) => (props.$fill ? '100%' : 'auto')};
    min-height: ${(props) => (props.$fill ? '100%' : '0')};
    object-fit: cover;
  }
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  padding: clamp(24px, 3vw, 40px) ${GRID.PADDING}px clamp(40px, 5vw, 72px) 0;

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

function Artist({ slug }) {
  const item = getArtist(slug)
  const images = (item?.images || []).map((entry) => mediaUrl(entry?.image)).filter(Boolean)
  const accentSrc = images[images.length - 1] || null
  const accent = useImageAccent(accentSrc, colors.gray)

  if (!item) return null

  const hasMeta = Boolean(
    item.subtitle || item.captionLabel || item.captionDate || item.captionLocation,
  )

  return (
    <Section data-nav-tone-left="light" data-nav-tone-right="dark">
      <Layout>
        <Left $start={1} $span={5} $startTablet={1} $spanTablet={8}>
          {item.title ? <Name>{item.title}</Name> : null}
          {item.bio ? <Bio>{item.bio}</Bio> : null}
        </Left>

        <Right $start={7} $end={-1} $startTablet={1} $spanTablet={8}>
          <Feed>
            {images.map((src, index) => (
              <FeedImage key={index} $fill={index === 0}>
                <img src={src} alt="" />
              </FeedImage>
            ))}
            {hasMeta ? (
              <Meta>
                {item.subtitle ? <WorkTitle $color={accent}>{item.subtitle}</WorkTitle> : null}
                {item.captionLabel ? <MetaLabel>{item.captionLabel}</MetaLabel> : null}
                {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
                {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
              </Meta>
            ) : null}
          </Feed>
        </Right>
      </Layout>
    </Section>
  )
}

export default Artist
