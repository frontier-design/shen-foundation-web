import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type } from '../../theme.js'
import { getPage, mediaUrl } from '../../content.js'

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
    width: calc(100% + ${GRID.PADDING_TABLET * 2}px);
    margin-left: -${GRID.PADDING_TABLET}px;
    margin-right: -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    width: calc(100% + ${GRID.PADDING_MOBILE * 2}px);
    margin-left: -${GRID.PADDING_MOBILE}px;
    margin-right: -${GRID.PADDING_MOBILE}px;
  }

  img {
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
  padding: 50px 0 50px ${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    width: calc(100% + ${GRID.PADDING_TABLET}px);
    margin-left: -${GRID.PADDING_TABLET}px;
    padding-left: ${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    width: calc(100% + ${GRID.PADDING_MOBILE * 2}px);
    margin-left: -${GRID.PADDING_MOBILE}px;
    margin-right: -${GRID.PADDING_MOBILE}px;
    padding-left: ${GRID.PADDING_MOBILE}px;
    padding-right: ${GRID.PADDING_MOBILE}px;
  }
`

const Title = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
`

const Description = styled.p`
  ${type.body}
  color: ${colors.black};
  margin-top: clamp(12px, 1.4vw, 20px);
  text-wrap: pretty;
  white-space: pre-line;

  max-width: calc((5 * 100% - ${GRID.GAP}px) / 6);

  @media ${GRID.MEDIA_TABLET} {
    max-width: calc((5 * 100% - ${GRID.GAP_TABLET}) / 6);
  }

  @media ${GRID.MEDIA_MOBILE} {
    max-width: none;
  }
`

const Intro = styled(Grid).attrs({ as: 'section' })`
  align-items: start;
  padding-top: clamp(72px, 12vw, 220px);
  row-gap: clamp(32px, 4vw, 56px);
`

const IntroTitle = styled.h2`
  ${type.gridTitle}
  color: ${colors.black};
  margin: 0;
`

const IntroBody = styled.p`
  ${type.body}
  color: ${colors.black};
  margin: 0;
  text-wrap: pretty;
  white-space: pre-line;
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

  img {
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
  text-wrap: balance;

  @media ${GRID.MEDIA_MOBILE} {
    ${type.displayLarge}
  }
`

const PersonRole = styled.p`
  ${type.gridSubtitle}
  color: ${colors.gray};
  margin-top: 6px;
`

const PersonBio = styled.p`
  ${type.body}
  color: ${colors.black};
  margin-top: clamp(24px, 3vw, 40px);
  text-wrap: pretty;
  white-space: pre-line;
  max-width: 90%;

  @media ${GRID.MEDIA_MOBILE} {
    max-width: none;
  }
`

function PersonItem({ item, index }) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const src = mediaUrl(item?.photo)

  const placement =
    side === 'left'
      ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4 }
      : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4 }

  return (
    <Person {...placement}>
      {src ? (
        <PersonMedia $side={side}>
          <img src={src} alt={item?.name || ''} />
        </PersonMedia>
      ) : null}
      {item?.name ? <PersonName>{item.name}</PersonName> : null}
      {item?.role ? <PersonRole>{item.role}</PersonRole> : null}
      {item?.bio ? <PersonBio>{item.bio}</PersonBio> : null}
    </Person>
  )
}

function About() {
  const page = getPage('about')

  if (!page) return null

  const heroSrc = mediaUrl(page.heroImage)
  const intro = page.intro
  const people = page.people || []

  return (
    <main>
      <Hero data-nav-tone-left="dark" data-nav-tone-right="dark">
        {heroSrc ? (
          <HeroMedia $start={1} $end={-1} $rowStart={1} $rowEnd={3}>
            <img src={heroSrc} alt="" />
          </HeroMedia>
        ) : null}

        <Card $start={1} $span={6} $startTablet={1} $spanTablet={6} $rowStart={2}>
          {page.title ? <Title>{page.title}</Title> : null}
          {page.description ? <Description>{page.description}</Description> : null}
        </Card>
      </Hero>

      {intro?.title || intro?.body ? (
        <Intro data-nav-tone-left="dark" data-nav-tone-right="dark">
          <GridCell $start={1} $span={6} $startTablet={1} $spanTablet={8}>
            {intro.title ? <IntroTitle>{intro.title}</IntroTitle> : null}
          </GridCell>
          <GridCell $start={7} $end={-1} $startTablet={1} $spanTablet={8}>
            {intro.body ? <IntroBody>{intro.body}</IntroBody> : null}
          </GridCell>
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