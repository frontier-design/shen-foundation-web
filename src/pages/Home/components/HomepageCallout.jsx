import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Grid, GridCell, GRID, useMediaQuery } from '../../../grid/index.js'
import { colors, type, easing, duration } from '../../../theme.js'
import { mediaUrl } from '../../../content.js'
import { useImageAccent } from '../../../hooks/useImageAccent.js'

gsap.registerPlugin(ScrollTrigger)

const Section = styled.section`
  width: 100%;
  height: 100svh;
`

const Layout = styled(Grid)`
  height: 100%;
  row-gap: 0;

  @media ${GRID.MEDIA_MOBILE} {
    grid-auto-rows: 1fr;
  }
`

const TextCell = styled(GridCell)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(120px, 16vh, 220px) 0 50px;

  @media ${GRID.MEDIA_MOBILE} {
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: ${GRID.PADDING_MOBILE}px 0;
    gap: 1.5rem;
  }
`

const Title = styled.h2`
  ${type.displayLarge}
  color: ${colors.black};
  min-height: 1.9em;

  span {
    display: block;
  }
`

const Subtitle = styled.p`
  ${type.titleLarge}
  color: ${(props) => props.$color || colors.accent};
  margin-top: 0.5rem;
  transition: color ${duration.base}s ${easing.reveal};
`

const Caption = styled.div`
  display: flex;
  flex-direction: column;
`

const CaptionLabel = styled.p`
  ${type.caption}
  color: ${colors.gray};
`

const CaptionLine = styled.p`
  ${type.caption}
  color: ${colors.black};
`

const ArrowButton = styled.a`
  margin-top: 2rem;
  width: 60px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${colors.black};
  background: transparent;
  cursor: pointer;
  color: ${colors.black};
  font-family: ${(props) => props.theme.fonts.display};
  font-size: 20px;
  line-height: 1;
  transition: background-color ${duration.fast}s ${easing.reveal},
    color ${duration.fast}s ${easing.reveal};

  &:hover {
    background-color: ${colors.black};
    color: ${colors.white};
  }

  @media ${GRID.MEDIA_MOBILE} {
    align-self: center;
    width: 44px;
    font-size: 16px;
  }
`

const ImageCell = styled(GridCell)`
  align-self: stretch;
  margin-right: -${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    margin-right: -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    margin: 0 -${GRID.PADDING_MOBILE}px;
  }
`

const ImageViewport = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: ${colors.gray};
`

const Image = styled.img`
  position: absolute;
  top: -15%;
  left: 0;
  width: 100%;
  height: 130%;
  object-fit: cover;
  will-change: transform;
`

function HomepageCallout({ callout }) {
  const sectionRef = useRef(null)
  const imageRef = useRef(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const src = mediaUrl(callout?.image)
  const link = callout?.link || undefined
  const accent = useImageAccent(src)

  useLayoutEffect(() => {
    if (reduceMotion || !imageRef.current) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [reduceMotion, src])

  return (
    <Section ref={sectionRef} data-nav-tone-left="light" data-nav-tone-right="dark">
      <Layout>
        <TextCell $start={1} $span={6} $spanMobile={4}>
          <div>
            {callout?.title ? (
              <Title>
                {callout.title.split(' ').map((word, i) => (
                  <span key={i}>{word}</span>
                ))}
              </Title>
            ) : null}
            {callout?.subtitle ? <Subtitle $color={accent}>{callout.subtitle}</Subtitle> : null}
          </div>
          <Caption>
            {callout?.captionLabel ? <CaptionLabel>{callout.captionLabel}</CaptionLabel> : null}
            {callout?.captionDate ? <CaptionLine>{callout.captionDate}</CaptionLine> : null}
            {callout?.captionLocation ? <CaptionLine>{callout.captionLocation}</CaptionLine> : null}
            <ArrowButton
              as={link ? 'a' : 'button'}
              href={link}
              type={link ? undefined : 'button'}
              aria-label="View more"
            >
              &rarr;
            </ArrowButton>
          </Caption>
        </TextCell>

        <ImageCell $start={7} $end={-1} $startMobile={1} $endMobile={-1}>
          <ImageViewport>
            {src ? <Image ref={imageRef} src={src} alt={callout?.title || ''} /> : null}
          </ImageViewport>
        </ImageCell>
      </Layout>
    </Section>
  )
}

export default HomepageCallout
