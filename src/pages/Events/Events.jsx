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
  gap: clamp(24px, 2.6vw, 40px);

  @media ${GRID.MEDIA_MOBILE} {
    row-gap: 6px;
    column-gap: 16px;
  }
`

const Tab = styled.button`
  ${type.titleLarge}
  font-size: clamp(24px, 2.9vw, 36px);
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

  const inTab = (key) => (card) => {
    if (key === 'all') return card.status !== 'archive'
    if (key === 'archive') return card.status === 'archive'
    return card.status !== 'archive' && card.captionLabel === key
  }

  const tabs = [
    { key: 'all', label: 'All' },
    ...labels.map((label) => ({ key: label, label: pluralize(label) })),
    { key: 'archive', label: 'Archive' },
  ].filter((tab) => cards.some(inTab(tab.key)))
  const current = tabs.some((tab) => tab.key === active) ? active : tabs[0]?.key

  const visible = current ? cards.filter(inTab(current)) : []

  return (
    <main>
      <Header>
        <GridCell $start={1} $end={-1}>
          <Title>Events</Title>
        </GridCell>
        {tabs.length > 0 ? (
          <GridCell $start={1} $end={-1}>
            <Tabs>
              {tabs.map((tab) => (
                <Tab key={tab.key} $active={current === tab.key} onClick={() => setActive(tab.key)}>
                  {tab.label}
                </Tab>
              ))}
            </Tabs>
          </GridCell>
        ) : null}
      </Header>
      <CardGrid items={visible} />
    </main>
  )
}

export default Events
