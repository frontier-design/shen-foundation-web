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
  const visible = exhibitionCards().filter((card) => card.status === active)

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
        <GridCell $start={1} $end={-1}>
          <Tabs>
            <Tab $active={active === 'ongoing'} onClick={() => setActive('ongoing')}>
              Ongoing
            </Tab>
            <Tab $active={active === 'archive'} onClick={() => setActive('archive')}>
              Archive
            </Tab>
          </Tabs>
        </GridCell>
      </Header>
      <CardGrid items={visible} />
    </main>
  )
}

export default Exhibitions
