import styled, { css } from 'styled-components'
import { Grid, GridCell, GRID } from '../grid'
import { colors, type, easing, duration, aspect } from '../theme.js'
import { mediaUrl, accentSource, isExhibition, exhibitionSlug, eventSlug } from '../content.js'
import { useImageAccent } from '../hooks/useImageAccent.js'
import { linkProps } from '../router.jsx'
import { SIZES, dimensions } from '../images.js'
import { blobVideo } from '../videos.js'
import MediaContent from './Media.jsx'

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
  position: relative;
  z-index: 1;
  background-color: ${colors.white};
  ${(props) => props.$natural && 'align-items: start;'}

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
  ${(props) => bleed(props.$side, GRID.PADDING)}
  aspect-ratio: ${aspect.landscape};
  overflow: hidden;
  background-color: ${colors.gray};

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
  }

  ${(props) =>
    props.$ratio &&
    css`
      aspect-ratio: ${props.$ratio};
    `}
`

const Title = styled.h3`
  ${type.gridTitle}
  color: ${colors.black};
  margin-top: 24px;
  text-wrap: pretty;
  max-width: calc(
    (min(${GRID.MAX_WIDTH}px, 100vw) - ${2 * GRID.PADDING + 11 * GRID.GAP}px) / 12 * 5 +
      ${4 * GRID.GAP}px
  );

  @media ${GRID.MEDIA_MOBILE} {
    ${type.displayLarge}
    max-width: none;
  }
`

const Subtitle = styled.p`
  ${type.gridSubtitle}
  color: ${(props) => props.$color || colors.accent};
  margin-top: 6px;
  transition: color ${duration.base}s ${easing.reveal};

  @media ${GRID.MEDIA_MOBILE} {
    ${type.titleLarge}
  }
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

function GridItem({ item, index, ratio }) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const src = mediaUrl(item?.image)
  const accent = useImageAccent(accentSource(item), colors.gray)
  const exhibition = isExhibition(item)
  const href = exhibition ? `/exhibitions/${exhibitionSlug(item)}` : `/events/${eventSlug(item)}`

  const placement =
    side === 'left'
      ? { $start: 1, $span: 6, $startTablet: 1, $spanTablet: 4 }
      : { $start: 7, $span: 6, $startTablet: 5, $spanTablet: 4 }

  const content = (
    <>
      {src || item?.video ? (
        <Media $side={side} $ratio={ratio}>
          <MediaContent image={src} video={item?.video} focus={item?.imageFocus} sizes={SIZES.card} posterWidth={1280} small alt={item?.title || ''} />
        </Media>
      ) : null}
      {item?.title ? <Title>{item.title}</Title> : null}
      {item?.subtitle ? <Subtitle $color={accent}>{item.subtitle}</Subtitle> : null}
      <Caption>
        {item?.captionLabel ? <CaptionLabel>{item.captionLabel}</CaptionLabel> : null}
        {item?.captionDate ? <CaptionLine>{item.captionDate}</CaptionLine> : null}
        {item?.captionLocation ? <CaptionLine>{item.captionLocation}</CaptionLine> : null}
      </Caption>
    </>
  )

  return (
    <Item {...placement}>
      <CardLink {...linkProps(href)}>{content}</CardLink>
    </Item>
  )
}

// Natural layout (homepage): each image keeps its own shape, but
// - never taller than TALLEST (cropped to it, keeping the focus point);
// - two cards side by side never end at (nearly) the same height: if their
//   heights are within MIN_DIFFERENCE, one of them (alternating sides row by
//   row) is cropped shorter.
const TALLEST = 1
const WIDEST = 2.4
const MIN_DIFFERENCE = 0.15
const FALLBACK = 4 / 3

const shapeOf = (item) => {
  const video = blobVideo(item?.video)
  const size = video || dimensions(mediaUrl(item?.image))
  const ratio = size?.width && size?.height ? size.width / size.height : FALLBACK
  return Math.min(WIDEST, Math.max(TALLEST, ratio))
}

function naturalRatios(items) {
  const ratios = items.map(shapeOf)
  for (let left = 0, row = 0; left + 1 < ratios.length; left += 2, row += 1) {
    const right = left + 1
    const heightLeft = 1 / ratios[left]
    const heightRight = 1 / ratios[right]
    if (Math.abs(heightLeft - heightRight) / Math.max(heightLeft, heightRight) >= MIN_DIFFERENCE) continue
    const [shorten, keep] = row % 2 === 0 ? [right, left] : [left, right]
    const shorter = ratios[keep] * (1 + MIN_DIFFERENCE + 0.1)
    ratios[shorten] = shorter <= WIDEST ? shorter : Math.max(TALLEST, ratios[keep] / (1 + MIN_DIFFERENCE + 0.1))
  }
  return ratios.map((ratio) => Number(ratio.toFixed(4)))
}

// natural: the homepage layout above, instead of the 4:3 crop used on the
// index and artist pages.
function CardGrid({ items, natural = false }) {
  if (!items || items.length === 0) return null
  const ratios = natural ? naturalRatios(items) : []

  return (
    <Section data-nav-tone-left="dark" data-nav-tone-right="dark" $natural={natural}>
      {items.map((item, index) => (
        <GridItem key={index} item={item} index={index} ratio={ratios[index]} />
      ))}
    </Section>
  )
}

export default CardGrid
