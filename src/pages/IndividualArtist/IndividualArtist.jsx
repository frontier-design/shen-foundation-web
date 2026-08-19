import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type, easing, duration } from '../../theme.js'
import { getArtist, mediaUrl, artistExhibitions, exhibitionSlug } from '../../content.js'
import { useImageAccent } from '../../hooks/useImageAccent.js'
import { linkProps } from '../../router.jsx'

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

  @media ${GRID.MEDIA_MOBILE} {
    padding-top: clamp(96px, 15.6vh, 192px);
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
  ${type.body}
  color: ${colors.black};
  margin: 0;
  white-space: pre-line;
  text-wrap: pretty;

  @media ${GRID.MEDIA_MOBILE} {
    margin-bottom: clamp(18px, 5.6vw, 31.5px);
  }
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
      height: 100vh;
      height: 100dvh;

      @media ${GRID.MEDIA_MOBILE} {
        height: 50vh;
        height: 50dvh;
      }
    `}

  img {
    display: block;
    width: 100%;
    height: ${(props) => (props.$fill ? '100%' : 'auto')};
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
  const accent = useImageAccent(src, colors.gray)

  return (
    <CardLink {...linkProps(`/exhibitions/${exhibitionSlug(item)}`)}>
      {src ? (
        <FeedImage>
          <img src={src} alt={item.subtitle || ''} />
        </FeedImage>
      ) : null}
      <Meta>
        {item.subtitle ? <WorkTitle $color={accent}>{item.subtitle}</WorkTitle> : null}
        {item.captionLabel ? <MetaLabel>{item.captionLabel}</MetaLabel> : null}
        {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
        {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
      </Meta>
    </CardLink>
  )
}

function IndividualArtist({ slug }) {
  const item = getArtist(slug)

  if (!item) return null

  const thumbnail = mediaUrl(item.thumbnail)
  const shows = artistExhibitions(item)

  return (
    <Section data-nav-tone-left="light" data-nav-tone-right="dark">
      <Layout>
        <Left $start={1} $span={5} $startTablet={1} $spanTablet={8}>
          {item.title ? <Name>{item.title}</Name> : null}
          {item.bio ? <Bio>{item.bio}</Bio> : null}
        </Left>

        <Right $start={7} $end={-1} $startTablet={1} $spanTablet={8}>
          <Feed>
            {thumbnail ? (
              <FeedImage $fill>
                <img src={thumbnail} alt="" />
              </FeedImage>
            ) : null}
            {shows.map((ex) => (
              <ExhibitionEntry key={exhibitionSlug(ex)} item={ex} />
            ))}
          </Feed>
        </Right>
      </Layout>
    </Section>
  )
}

export default IndividualArtist
