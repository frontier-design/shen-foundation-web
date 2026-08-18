import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../grid'
import { colors, type, easing, duration } from '../theme.js'
import { mediaUrl } from '../content.js'
import { useImageAccent } from '../hooks/useImageAccent.js'

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
`

const Item = styled(GridCell).attrs({ as: 'article' })``

const Media = styled.div`
  ${(props) => bleed(props.$side, GRID.PADDING)}

  @media ${GRID.MEDIA_TABLET} {
    ${(props) => bleed(props.$side, GRID.PADDING_TABLET)}
  }

  @media ${GRID.MEDIA_MOBILE} {
    ${(props) => bleed(props.$side, GRID.PADDING_MOBILE)}
  }

  img {
    display: block;
    width: 100%;
    height: auto;
  }
`

const Title = styled.h3`
  ${type.gridTitle}
  color: ${colors.black};
  margin-top: 24px;
  text-wrap: balance;
`

const Subtitle = styled.p`
  ${type.gridSubtitle}
  color: ${(props) => props.$color || colors.accent};
  margin-top: 6px;
  transition: color ${duration.base}s ${easing.reveal};
`

const Caption = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: clamp(34px, 2vw, 28px);
`

const CaptionLabel = styled.p`
  ${type.caption}
  color: ${colors.gray};
`

const CaptionLine = styled.p`
  ${type.caption}
  color: ${colors.black};
`

function GridItem({ item, index }) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const src = mediaUrl(item?.image)
  const accent = useImageAccent(src, colors.gray)

  const placement =
    side === 'left'
      ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4, $startMobile: 1, $spanMobile: 2 }
      : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4, $startMobile: 3, $spanMobile: 2 }

  return (
    <Item {...placement}>
      {src ? (
        <Media $side={side}>
          <img src={src} alt={item?.title || ''} />
        </Media>
      ) : null}
      {item?.title ? <Title>{item.title}</Title> : null}
      {item?.subtitle ? <Subtitle $color={accent}>{item.subtitle}</Subtitle> : null}
      <Caption>
        {item?.captionLabel ? <CaptionLabel>{item.captionLabel}</CaptionLabel> : null}
        {item?.captionDate ? <CaptionLine>{item.captionDate}</CaptionLine> : null}
        {item?.captionLocation ? <CaptionLine>{item.captionLocation}</CaptionLine> : null}
      </Caption>
    </Item>
  )
}

function CardGrid({ items }) {
  if (!items || items.length === 0) return null

  return (
    <Section data-nav-tone-left="dark" data-nav-tone-right="dark">
      {items.map((item, index) => (
        <GridItem key={index} item={item} index={index} />
      ))}
    </Section>
  )
}

export default CardGrid
