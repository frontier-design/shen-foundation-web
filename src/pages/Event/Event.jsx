import { useState } from 'react'
import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type } from '../../theme.js'
import { getEvent, mediaUrl } from '../../content.js'

const Layout = styled(Grid).attrs({ as: 'main' })`
  align-items: start;
  padding-top: clamp(96px, 12vw, 180px);
  padding-bottom: clamp(64px, 10vh, 160px);
  row-gap: clamp(40px, 6vw, 72px);
`

const Thumb = styled.div`
  img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
`

const Title = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
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
  margin-top: clamp(40px, 5vw, 72px);
`

const SectionRow = styled.div`
  border-top: 1px solid ${colors.black};

  &:last-child {
    border-bottom: 1px solid ${colors.black};
  }
`

const SectionButton = styled.button`
  ${type.caption}
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
  flex-shrink: 0;
`

const SectionContent = styled.div`
  ${type.body}
  color: ${colors.black};
  padding-bottom: clamp(20px, 2.4vw, 32px);
  white-space: pre-line;
`

function Event({ slug }) {
  const item = getEvent(slug)
  const [openIndex, setOpenIndex] = useState(null)

  if (!item) return null

  const src = mediaUrl(item.image)
  const sections = item.sections || []

  return (
    <Layout>
      <GridCell $start={1} $span={6} $startTablet={1} $spanTablet={8}>
        {src ? (
          <Thumb>
            <img src={src} alt={item.title || ''} />
          </Thumb>
        ) : null}
      </GridCell>

      <GridCell $start={7} $span={6} $startTablet={1} $spanTablet={8}>
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
                    <SectionToggle>{open ? '−' : '+'}</SectionToggle>
                  </SectionButton>
                  {open && section.content ? (
                    <SectionContent>{section.content}</SectionContent>
                  ) : null}
                </SectionRow>
              )
            })}
          </Sections>
        ) : null}
      </GridCell>
    </Layout>
  )
}

export default Event
