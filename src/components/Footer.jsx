import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../grid'
import { colors, type } from '../theme.js'
import { linkProps } from '../router.jsx'
import wordmark from '../assets/images/logos/shen-wordmark-oneline.svg'

const FooterEl = styled(Grid).attrs({ as: 'footer' })`
  align-items: start;
  padding-top: clamp(96px, 14vh, 220px);
  padding-bottom: clamp(20px, 3vh, 40px);
  row-gap: clamp(64px, 10vw, 160px);
`

const LinksCell = styled(GridCell)`
  display: flex;
  justify-content: space-between;
  gap: clamp(24px, 4vw, 80px);

  @media ${GRID.MEDIA_MOBILE} {
    flex-direction: column;
    justify-content: flex-start;
    gap: clamp(28px, 5vh, 44px);
  }
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`

const FooterLink = styled.a`
  ${type.navLink}
  color: ${colors.black};
  text-decoration: ${(props) => (props.$underline ? 'underline' : 'none')};
  overflow-wrap: anywhere;
`

const Wordmark = styled.div`
  width: 100%;
  aspect-ratio: 1188 / 113;
  background-color: ${colors.gray};
  -webkit-mask: url(${wordmark}) no-repeat center / contain;
  mask: url(${wordmark}) no-repeat center / contain;
`

function Footer() {
  return (
    <FooterEl data-nav-tone-left="light" data-nav-tone-right="light">
      <LinksCell $start={7} $end={-1} $startTablet={5} $endTablet={-1}>
        <Group>
          <FooterLink href="#">About</FooterLink>
          <FooterLink {...linkProps('/artists')}>Artists</FooterLink>
          <FooterLink {...linkProps('/exhibitions')}>Exhibitions</FooterLink>
          <FooterLink {...linkProps('/events')}>Events</FooterLink>
        </Group>
        <Group>
          <FooterLink href="#">Contact</FooterLink>
          <FooterLink href="#">Instagram</FooterLink>
          <FooterLink href="mailto:info@shenfoundation.com" $underline>
            info@shenfoundation.com
          </FooterLink>
        </Group>
      </LinksCell>
      <GridCell $start={1} $end={-1}>
        <Wordmark role="img" aria-label="Shen Foundation" />
      </GridCell>
    </FooterEl>
  )
}

export default Footer
