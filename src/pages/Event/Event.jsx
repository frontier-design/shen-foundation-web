import { useState } from 'react'
import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, fonts, type, easing, duration } from '../../theme.js'
import { getEvent, mediaUrl } from '../../content.js'

const Section = styled.main`
  width: 100%;
`

const Layout = styled(Grid)`
  height: 100vh;
  height: 100dvh;
  align-items: stretch;
  row-gap: 0;

  @media ${GRID.MEDIA_MOBILE} {
    height: auto;
    align-items: start;
    row-gap: clamp(32px, 8vw, 48px);
  }
`

const ImageCell = styled(GridCell)`
  height: 100%;
  margin-left: -${GRID.PADDING}px;

  @media ${GRID.MEDIA_TABLET} {
    margin-left: -${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    height: 50vh;
    height: 50dvh;
    margin: 0 -${GRID.PADDING_MOBILE}px;
  }
`

const ImageViewport = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: ${colors.gray};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const contentPad = 'clamp(20px, 2.4vw, 35px)'

const Content = styled(GridCell)`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  padding-left: ${contentPad};
  padding-top: clamp(96px, 12vh, 180px);
  padding-bottom: 35px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media ${GRID.MEDIA_MOBILE} {
    height: auto;
    overflow: visible;
    padding-left: 0;
    padding-top: 0;
  }
`

const Title = styled.h1`
  ${type.gridTitle}
  color: ${colors.black};
  margin: 0;
  max-width: calc((5 * 100% - ${contentPad} - ${GRID.GAP}px) / 6);

  @media ${GRID.MEDIA_TABLET} {
    max-width: none;
  }

  @media ${GRID.MEDIA_MOBILE} {
    ${type.displayLarge}
    max-width: none;
    text-wrap: wrap;
  }
`

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: clamp(24px, 3vw, 40px);
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

const Sections = styled.div`
  margin-top: auto;

  @media ${GRID.MEDIA_MOBILE} {
    margin-top: clamp(40px, 12vw, 64px);
  }
`

const SectionRow = styled.div`
  border-bottom: 1px solid ${colors.gray};

  &:last-child {
    border-bottom: none;
  }
`

const SectionButton = styled.button`
  ${type.caption}
  font-family: ${fonts.display};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: clamp(16px, 1.6vw, 24px) 0;
  background: none;
  border: none;
  color: ${colors.black};
  text-align: left;
  cursor: pointer;
`

const SectionToggle = styled.span`
  position: relative;
  flex: none;
  width: clamp(20.8px, 2.24vw, 27.2px);
  height: clamp(20.8px, 2.24vw, 27.2px);
  color: currentColor;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background-color: currentColor;
    transition: transform ${duration.fast}s ${easing.reveal};
  }

  &::before {
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    transform: translateY(-50%);
  }

  &::after {
    left: 50%;
    top: 0;
    width: 1.5px;
    height: 100%;
    transform: translateX(-50%) rotate(${(props) => (props.$open ? '90deg' : '0deg')});
  }
`

const SectionCollapse = styled.div`
  display: grid;
  grid-template-rows: ${(props) => (props.$open ? '1fr' : '0fr')};
  transition: grid-template-rows ${duration.base}s ${easing.reveal};
`

const SectionContentInner = styled.div`
  overflow: hidden;
  min-height: 0;
`

const SectionContent = styled.div`
  ${type.body}
  color: ${colors.black};
  padding-bottom: clamp(20px, 2.4vw, 32px);
  white-space: pre-line;
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition: opacity ${duration.base}s ${easing.reveal};
`

function Event({ slug }) {
  const item = getEvent(slug)
  const [openIndex, setOpenIndex] = useState(null)

  if (!item) return null

  const src = mediaUrl(item.image)
  const sections = item.sections || []

  return (
    <Section data-nav-tone-left="light" data-nav-tone-right="dark">
      <Layout>
        <ImageCell $start={1} $span={6} $startTablet={1} $spanTablet={8}>
          <ImageViewport>
            {src ? <img src={src} alt={item.title || ''} /> : null}
          </ImageViewport>
        </ImageCell>

        <Content $start={7} $end={-1} $startTablet={1} $spanTablet={8}>
          {item.title ? <Title>{item.title}</Title> : null}
          <Meta>
            {item.captionLabel ? <MetaLabel>{item.captionLabel}</MetaLabel> : null}
            {item.captionDate ? <MetaLine>{item.captionDate}</MetaLine> : null}
            {item.captionLocation ? <MetaLine>{item.captionLocation}</MetaLine> : null}
          </Meta>

          {sections.length > 0 ? (
            <Sections>
              {sections.map((section, index) => {
                const open = openIndex === index
                return (
                  <SectionRow key={index}>
                    <SectionButton
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenIndex(open ? null : index)}
                    >
                      {section.title}
                      <SectionToggle $open={open} aria-hidden="true" />
                    </SectionButton>
                    {section.content ? (
                      <SectionCollapse $open={open}>
                        <SectionContentInner>
                          <SectionContent $open={open}>{section.content}</SectionContent>
                        </SectionContentInner>
                      </SectionCollapse>
                    ) : null}
                  </SectionRow>
                )
              })}
            </Sections>
          ) : null}
        </Content>
      </Layout>
    </Section>
  )
}

export default Event
