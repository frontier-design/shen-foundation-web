import { useState } from 'react'
import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../../grid'
import { colors, type, easing, duration } from '../../theme.js'
import { exhibitionCards } from '../../content.js'
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
  gap: clamp(24px, 2.6vw, 40px);
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

function Exhibitions() {
  const [active, setActive] = useState('ongoing')
  const cards = exhibitionCards()
  const tabs = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'archive', label: 'Archive' },
  ].filter((tab) => cards.some((card) => card.status === tab.key))
  const current = tabs.some((tab) => tab.key === active) ? active : tabs[0]?.key
  const visible = cards.filter((card) => card.status === current)

  return (
    <main>
      <Header>
        <GridCell $start={1} $end={-1}>
          <Title>
            Exhibitions
            <br />
            &amp; Projects
          </Title>
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

export default Exhibitions
