import { useState } from 'react'
import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type, easing, duration } from '../../theme.js'
import { eventCards } from '../../content.js'
import CardGrid from '../../components/CardGrid.jsx'

const Header = styled(Grid).attrs({ as: 'header' })`
  align-items: start;
  padding-top: clamp(160px, 26vh, 320px);
  padding-bottom: clamp(48px, 7vw, 120px);
  row-gap: clamp(26px, 3.2vw, 44px);

  @media ${GRID.MEDIA_MOBILE} {
    padding-top: clamp(96px, 15.6vh, 192px);
  }
`

const Title = styled.h1`
  ${type.displayLarge}
  color: ${colors.black};
  margin: 0;
`

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: clamp(16px, 1.6vw, 24px);
`

const Tab = styled.button`
  ${type.titleLarge}
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${(props) => (props.$active ? colors.black : colors.gray)};
  transition: color ${duration.fast}s ${easing.reveal};
`

const pluralize = (value) => (value.endsWith('s') ? value : `${value}s`)

function Events() {
  const [active, setActive] = useState('all')
  const cards = eventCards()

  const labels = [
    ...new Set(
      cards
        .filter((card) => card.status !== 'archive')
        .map((card) => card.captionLabel)
        .filter(Boolean),
    ),
  ]

  const tabs = [
    { key: 'all', label: 'All' },
    ...labels.map((label) => ({ key: label, label: pluralize(label) })),
    { key: 'archive', label: 'Archive' },
  ]

  const visible = cards.filter((card) => {
    if (active === 'all') return card.status !== 'archive'
    if (active === 'archive') return card.status === 'archive'
    return card.status !== 'archive' && card.captionLabel === active
  })

  return (
    <main>
      <Header>
        <GridCell $start={1} $end={-1}>
          <Title>Events</Title>
        </GridCell>
        <GridCell $start={1} $end={-1}>
          <Tabs>
            {tabs.map((tab) => (
              <Tab key={tab.key} $active={active === tab.key} onClick={() => setActive(tab.key)}>
                {tab.label}
              </Tab>
            ))}
          </Tabs>
        </GridCell>
      </Header>
      <CardGrid items={visible} />
    </main>
  )
}

export default Events
