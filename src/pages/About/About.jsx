import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type } from '../../theme.js'
import { getPage, mediaUrl, toPlainText } from '../../content.js'
import RichText from '../../components/RichText.jsx'
import { SIZES } from '../../images.js'
import Media from '../../components/Media.jsx'

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

const Hero = styled(Grid).attrs({ as: 'section' })`
  min-height: 100vh;
  min-height: 100dvh;
  grid-template-rows: 1fr auto;
  row-gap: 0;

  @media ${GRID.MEDIA_TABLET} {
    grid-template-rows: auto 1fr;
    row-gap: clamp(32px, 8vw, 48px);
  }
`

const HeroMedia = styled(GridCell)`
  position: relative;
  min-height: 0;
  overflow: hidden;
  background-color: ${colors.gray};
  width: calc(100% + ${GRID.PADDING * 2}px);
  margin-left: -${GRID.PADDING}px;
  margin-right: -${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    grid-row: 2;
    min-height: 0;
    width: calc(100% + ${GRID.PADDING_TABLET * 2}px);
    margin-left: -${GRID.PADDING_TABLET}px;
    margin-right: -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    width: calc(100% + ${GRID.PADDING_MOBILE * 2}px);
    margin-left: -${GRID.PADDING_MOBILE}px;
    margin-right: -${GRID.PADDING_MOBILE}px;
  }

  img,
  video {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Card = styled(GridCell)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 50vh;
  min-height: 50dvh;
  background-color: ${colors.white};

  width: calc(100% + ${GRID.PADDING}px);
  margin-left: -${GRID.PADDING}px;
  padding: ${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    grid-row: 1;
    gap: clamp(32px, 8vw, 48px);
    min-height: 0;
    background-color: transparent;
    width: auto;
    margin: 0;
    padding: clamp(96px, 14vh, 140px) 0 0;
  }

  @media ${GRID.MEDIA_MOBILE} {
    padding-top: clamp(96px, 15.6vh, 192px);
  }
`

const Title = styled.h1`
  ${type.gridTitle}
  color: ${colors.black};
  margin: 0;

  @media ${GRID.MEDIA_TABLET} {
    ${type.displayLarge}
  }
`

const HeroBody = styled(RichText)`
  ${type.body}
  color: ${colors.black};
  margin: clamp(24px, 3vw, 40px) 0 0;
  max-width: 46ch;
  text-wrap: pretty;
`

const Intro = styled(Grid).attrs({ as: 'section' })`
  align-items: start;
  padding-top: clamp(72px, 12vw, 220px);
  row-gap: 100px;
`

const IntroBlock = styled(GridCell).attrs({ as: 'article' })`
  row-gap: clamp(32px, 4vw, 56px);
`

const IntroTitle = styled.h2`
  ${type.gridTitle}
  color: ${colors.black};
  margin: 0;

  @media ${GRID.MEDIA_TABLET} {
    ${type.displayLarge}
  }
`

const IntroBody = styled(RichText)`
  ${type.body}
  color: ${colors.black};
  margin: 0;
`

const People = styled(Grid).attrs({ as: 'section' })`
  row-gap: clamp(96px, 12vw, 200px);
  padding-top: clamp(96px, 12vw, 200px);
  padding-bottom: clamp(64px, 10vh, 160px);

  @media ${GRID.MEDIA_MOBILE} {
    row-gap: clamp(72px, 18vw, 120px);
  }
`

const Person = styled(GridCell).attrs({ as: 'article' })``

const PersonMedia = styled.div`
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background-color: ${colors.gray};

  ${(props) => bleed(props.$side, GRID.PADDING)}

  @media ${GRID.MEDIA_TABLET} {
    ${(props) => bleed(props.$side, GRID.PADDING_TABLET)}
  }

  @media ${GRID.MEDIA_MOBILE} {
    width: calc(100% + ${GRID.PADDING_MOBILE * 2}px);
    margin-left: -${GRID.PADDING_MOBILE}px;
    margin-right: -${GRID.PADDING_MOBILE}px;
  }

  img,
  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
  }
`

const PersonName = styled.h3`
  ${type.gridTitle}
  color: ${colors.black};
  margin-top: 24px;
  width: min-content;

  @media ${GRID.MEDIA_TABLET} {
    ${type.displayLarge}
  }
`

const PersonRole = styled.p`
  ${type.gridSubtitle}
  color: ${colors.gray};
  margin-top: 6px;

  @media ${GRID.MEDIA_MOBILE} {
    ${type.titleLarge}
  }
`

const PersonBio = styled(RichText)`
  ${type.body}
  color: ${colors.black};
  margin-top: clamp(24px, 3vw, 40px);
  text-wrap: pretty;
  max-width: 95%;

  @media ${GRID.MEDIA_TABLET} {
    max-width: none;
  }
`

function IntroItem({ item }) {
  return (
    <IntroBlock $start={1} $end={-1} $subgrid>
      {item?.title ? (
        <GridCell $start={1} $span={6} $startTablet={1} $spanTablet={8}>
          <IntroTitle>{item.title}</IntroTitle>
        </GridCell>
      ) : null}
      {toPlainText(item?.body) ? (
        <GridCell $start={7} $end={-1} $startTablet={1} $spanTablet={8}>
          <IntroBody html={item.body} />
        </GridCell>
      ) : null}
    </IntroBlock>
  )
}

function PersonItem({ item, index }) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const src = mediaUrl(item?.photo)
  const video = mediaUrl(item?.photoVideo)

  const placement =
    side === 'left'
      ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4 }
      : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4 }

  return (
    <Person {...placement}>
      {src || video ? (
        <PersonMedia $side={side}>
          <Media image={src} video={video} sizes={SIZES.card} posterWidth={1280} alt={item?.name || ''} />
        </PersonMedia>
      ) : null}
      {item?.name ? <PersonName>{item.name}</PersonName> : null}
      {item?.role ? <PersonRole>{item.role}</PersonRole> : null}
      {toPlainText(item?.bio) ? <PersonBio html={item.bio} /> : null}
    </Person>
  )
}

function About() {
  const page = getPage('about')

  if (!page) return null

  const heroSrc = mediaUrl(page.heroImage)
  const heroVideo = mediaUrl(page.heroVideo)
  const intro = (page.intro || []).filter((item) => item?.title || toPlainText(item?.body))
  const people = page.people || []

  return (
    <main>
      <Hero data-nav-tone-left="dark" data-nav-tone-right="dark">
        {heroSrc || heroVideo ? (
          <HeroMedia $start={1} $end={-1} $rowStart={1} $rowEnd={3}>
            <Media image={heroSrc} video={heroVideo} sizes={SIZES.fullBleed} alt="" />
          </HeroMedia>
        ) : null}

        <Card $start={1} $span={6} $startTablet={1} $spanTablet={8} $rowStart={2}>
          <Title>About Us</Title>
          {toPlainText(page.heroBody) ? <HeroBody html={page.heroBody} /> : null}
        </Card>
      </Hero>

      {intro.length > 0 ? (
        <Intro data-nav-tone-left="dark" data-nav-tone-right="dark">
          {intro.map((item, index) => (
            <IntroItem key={index} item={item} />
          ))}
        </Intro>
      ) : null}

      {people.length > 0 ? (
        <People data-nav-tone-left="dark" data-nav-tone-right="dark">
          {people.map((item, index) => (
            <PersonItem key={index} item={item} index={index} />
          ))}
        </People>
      ) : null}
    </main>
  )
}

export default About