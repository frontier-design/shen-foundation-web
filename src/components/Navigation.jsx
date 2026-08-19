import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Grid, GridCell, GRID } from '../grid'
import { colors, type, easing, duration } from '../theme.js'
import { linkProps } from '../router.jsx'

const LUMA_THRESHOLD = 140
const SAMPLE = 8

const iconColor = (tone) => (tone === 'dark' ? colors.white : colors.black)

const relLuminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const sampleCanvas = document.createElement('canvas')
sampleCanvas.width = SAMPLE
sampleCanvas.height = SAMPLE
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })

const parseColor = (str) => {
  const m = /rgba?\(([^)]+)\)/.exec(str)
  if (!m) return null
  const [r, g, b, a = 1] = m[1].split(',').map((v) => parseFloat(v))
  return { r, g, b, a }
}

const backgroundLuminance = (el) => {
  let node = el
  while (node && node.nodeType === 1) {
    const c = parseColor(getComputedStyle(node).backgroundColor)
    if (c && c.a > 0) return relLuminance(c.r, c.g, c.b)
    node = node.parentElement
  }
  return 255
}

const imageLuminance = (img, x, y) => {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  const rect = img.getBoundingClientRect()
  if (!nw || !nh || !rect.width || !rect.height) return null

  const fit = getComputedStyle(img).objectFit || 'fill'
  const boxX = Math.min(Math.max(x - rect.left, 0), rect.width)
  const boxY = Math.min(Math.max(y - rect.top, 0), rect.height)

  let sx
  let sy
  if (fit === 'cover' || fit === 'contain') {
    const scale =
      fit === 'cover'
        ? Math.max(rect.width / nw, rect.height / nh)
        : Math.min(rect.width / nw, rect.height / nh)
    sx = (boxX - (rect.width - nw * scale) / 2) / scale
    sy = (boxY - (rect.height - nh * scale) / 2) / scale
  } else {
    sx = (boxX / rect.width) * nw
    sy = (boxY / rect.height) * nh
  }

  const half = 12
  const cx = Math.min(Math.max(Math.round(sx) - half, 0), nw - 1)
  const cy = Math.min(Math.max(Math.round(sy) - half, 0), nh - 1)
  const cw = Math.min(half * 2, nw - cx)
  const ch = Math.min(half * 2, nh - cy)

  sampleCtx.clearRect(0, 0, SAMPLE, SAMPLE)
  sampleCtx.drawImage(img, cx, cy, cw, ch, 0, 0, SAMPLE, SAMPLE)
  const { data } = sampleCtx.getImageData(0, 0, SAMPLE, SAMPLE)
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += relLuminance(data[i], data[i + 1], data[i + 2])
  }
  return sum / (data.length / 4)
}

const toneAt = (x, y, iconEl) => {
  const prev = iconEl.style.pointerEvents
  iconEl.style.pointerEvents = 'none'
  const el = document.elementFromPoint(x, y)
  iconEl.style.pointerEvents = prev
  if (!el) return null

  let luma = null
  if (el.tagName === 'IMG') {
    try {
      luma = imageLuminance(el, x, y)
    } catch {
      luma = null
    }
  }
  if (luma == null) luma = backgroundLuminance(el)
  return luma > LUMA_THRESHOLD ? 'light' : 'dark'
}

const Nav = styled.nav`
  position: fixed;
  top: ${GRID.PADDING}px;
  left: 0;
  width: 100%;
  z-index: 100;
  pointer-events: none;

  @media ${GRID.MEDIA_TABLET} {
    top: ${GRID.PADDING_TABLET}px;
  }

  @media ${GRID.MEDIA_MOBILE} {
    top: ${GRID.PADDING_MOBILE}px;
  }
`

const Bar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media ${GRID.MEDIA_MOBILE} {
    align-items: center;
  }
`

const LogoLink = styled.a`
  display: block;
  pointer-events: auto;
  line-height: 0;
`

const Logo = styled.svg`
  display: block;
  width: auto;
  height: clamp(28px, 3.2vw, 44px);
  color: ${(props) => props.$color};
  fill: currentColor;
  transition: color ${duration.fast}s ${easing.reveal};
`

const Plus = styled.button`
  position: relative;
  flex: none;
  width: clamp(26px, 2.8vw, 34px);
  height: clamp(26px, 2.8vw, 34px);
  padding: 0;
  border: none;
  background: none;
  pointer-events: auto;
  cursor: pointer;
  color: ${(props) => props.$color};

  &::before,
  &::after {
    content: '';
    position: absolute;
    background-color: currentColor;
    transition: background-color ${duration.fast}s ${easing.reveal},
      transform ${duration.fast}s ${easing.reveal};
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

const Menu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50vh;
  z-index: 90;
  background-color: ${colors.black};
  overflow: hidden;
  transform: translateY(${(props) => (props.$open ? '0' : '-100%')});
  transition: transform ${duration.slow}s ${easing.reveal};
  pointer-events: ${(props) => (props.$open ? 'auto' : 'none')};

  @media ${GRID.MEDIA_MOBILE} {
    height: auto;
    padding-top: clamp(96px, 14vh, 160px);
    padding-bottom: clamp(40px, 8vh, 88px);
  }
`

const MenuGrid = styled(Grid)`
  height: 100%;
  grid-auto-rows: 1fr;

  @media ${GRID.MEDIA_MOBILE} {
    height: auto;
    grid-auto-rows: auto;
  }
`

const MenuInner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  padding: ${GRID.PADDING}px 0;

  @media ${GRID.MEDIA_MOBILE} {
    height: auto;
    justify-content: flex-start;
    gap: clamp(32px, 5vh, 50px);
    padding: 0;
  }
`

const MenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`

const MenuLink = styled.a`
  ${type.navLink}
  color: ${colors.white};
  text-decoration: none;
`

const MenuSubLink = styled.a`
  ${type.navLink}
  color: ${colors.white};
  text-decoration: ${(props) => (props.$underline ? 'underline' : 'none')};
`

const MenuDescription = styled.p`
  ${type.navDescription}
  margin: 0;
  max-width: 580px;
  color: ${colors.white};
`

function ShenMark({ color, innerRef }) {
  return (
    <Logo
      ref={innerRef}
      $color={color}
      viewBox="0 0 50 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Shen Foundation"
    >
      <path d="M1.35176 1.33818C0.455117 2.22634 0 3.40488 0 4.83986C0 6.27484 0.455117 7.45678 1.35176 8.34494C2.24841 9.23309 3.42187 9.68312 4.84326 9.68312H18.799C19.874 9.68312 20.7418 10.0109 21.3803 10.6596C22.0222 11.3083 22.3483 12.1744 22.3483 13.2306C22.3483 14.2869 22.0324 15.1462 21.3803 15.8051C20.7418 16.4521 19.874 16.7799 18.799 16.7799H0.672486V18.4084H23.9768V8.05455H4.95534C3.98567 8.05455 3.1994 7.75906 2.61862 7.17828C2.02765 6.5873 1.74065 5.82312 1.74065 4.84156C1.74065 3.86 2.02765 3.09751 2.61862 2.50654C3.2011 1.92406 3.98737 1.63027 4.95534 1.63027H23.9768V0H4.84326C3.42356 0 2.24841 0.450022 1.35176 1.33818Z" />
      <path d="M48.2593 0V5.95727C48.2458 6.64165 48.0641 7.1528 47.7057 7.51792C47.3508 7.87963 46.8464 8.05624 46.1655 8.05624H30.5251C29.8577 8.05624 29.3567 7.87963 28.9933 7.51622C28.6299 7.1528 28.4448 6.64165 28.4312 5.96067V0H26.6906V18.4084H28.4312V11.7804C28.4448 11.096 28.6282 10.5866 28.9933 10.2214C29.3584 9.85633 29.8577 9.68142 30.5251 9.68142H46.1655C46.8464 9.68142 47.3491 9.85803 47.7057 10.2197C48.059 10.5798 48.2458 11.1045 48.2593 11.7753V18.4084H50V0H48.2593Z" />
      <path d="M0.672485 39.568H23.9768V37.9394H4.50531C3.83792 37.9394 3.33696 37.7628 2.97354 37.3994C2.61013 37.036 2.42502 36.5248 2.41144 35.8455V32.9399C2.42502 32.2555 2.60843 31.7461 2.97354 31.381C3.33865 31.0159 3.83792 30.8409 4.50531 30.8409H23.9768V29.2124H4.50531C3.83792 29.2124 3.33696 29.0358 2.97354 28.6723C2.61013 28.3089 2.42502 27.7978 2.41144 27.1168V24.8854C2.42502 24.2095 2.61352 23.6847 2.97184 23.3247C3.33186 22.9664 3.84811 22.7847 4.50362 22.7847H23.9751V21.1561H0.672485V39.5646V39.568Z" />
      <path d="M48.2576 21.1578V35.8218C48.2576 36.4942 48.0759 37.0173 47.7176 37.3739C47.3916 37.7017 46.9127 37.846 46.1621 37.846H41.4988C40.7482 37.846 40.2693 37.7 39.9433 37.3722C39.5849 37.0156 39.4032 36.4942 39.4032 35.8201V21.1561H26.6939V39.5663H28.4346V24.8803C28.4346 24.2078 28.6163 23.683 28.9729 23.3264C29.3652 22.9375 29.766 22.7847 30.4045 22.7847H35.567C36.2395 22.7847 36.7625 22.9664 37.1226 23.3247C37.486 23.6881 37.6626 24.1976 37.6626 24.8803V35.8201C37.6626 37.0037 38.0022 37.936 38.6696 38.5864C39.3336 39.2351 40.2846 39.5646 41.4988 39.5646H46.1621C47.3763 39.5646 48.3273 39.2351 48.9913 38.5864C49.6603 37.9343 49.9983 37.0037 49.9983 35.8201L49.9949 21.1561H48.2576V21.1578Z" />
    </Logo>
  )
}

function Navigation() {
  const logoRef = useRef(null)
  const plusRef = useRef(null)
  const [tones, setTones] = useState({ logo: 'dark', plus: 'dark' })
  const [open, setOpen] = useState(false)

  const navTo = (to) => (event) => {
    linkProps(to).onClick(event)
    setOpen(false)
  }

  useLayoutEffect(() => {
    let raf
    let lastSample = 0
    let last = { logo: null, plus: null }

    const sample = (now) => {
      if (now - lastSample >= 66) {
        lastSample = now
        const logoEl = logoRef.current
        const plusEl = plusRef.current
        if (logoEl && plusEl) {
          const l = logoEl.getBoundingClientRect()
          const p = plusEl.getBoundingClientRect()

          const logo = toneAt(l.left + l.width / 2, l.top + l.height / 2, logoEl)
          const plus = toneAt(p.left + p.width / 2, p.top + p.height / 2, plusEl)

          const nextLogo = logo ?? last.logo ?? 'dark'
          const nextPlus = plus ?? last.plus ?? 'dark'
          if (nextLogo !== last.logo || nextPlus !== last.plus) {
            last = { logo: nextLogo, plus: nextPlus }
            setTones(last)
          }
        }
      }
      raf = requestAnimationFrame(sample)
    }

    raf = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <Menu $open={open} aria-hidden={!open} data-nav-tone-left="dark" data-nav-tone-right="dark">
        <MenuGrid>
          <GridCell $start={7} $startTablet={5} $end={-1}>
            <MenuInner>
              <MenuGroup>
                <MenuLink href="/about" onClick={navTo('/about')}>About</MenuLink>
                  <MenuLink href="/artists" onClick={navTo('/artists')}>
                  Artists
                </MenuLink>
                <MenuLink href="/exhibitions" onClick={navTo('/exhibitions')}>
                  Exhibitions
                </MenuLink>
                <MenuLink href="/events" onClick={navTo('/events')}>
                  Events
                </MenuLink>
              </MenuGroup>
              <MenuGroup>
                <MenuSubLink href="#">Contact</MenuSubLink>
                <MenuSubLink href="#">Instagram</MenuSubLink>
                <MenuSubLink href="mailto:info@shenfoundation.com" $underline>
                  info@shenfoundation.com
                </MenuSubLink>
              </MenuGroup>
              <MenuDescription>
                The Shen Foundation is devoted to exhibiting contemporary art and
                to deepening our understanding of the artistic practices that
                define our time
              </MenuDescription>
            </MenuInner>
          </GridCell>
        </MenuGrid>
      </Menu>
      <Nav>
        <Grid>
          <GridCell $start={1} $end={-1}>
            <Bar>
              <LogoLink ref={logoRef} href="/" aria-label="Shen Foundation home">
                <ShenMark color={iconColor(tones.logo)} />
              </LogoLink>
              <Plus
                ref={plusRef}
                type="button"
                $color={iconColor(tones.plus)}
                $open={open}
                onClick={() => setOpen((prev) => !prev)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              />
            </Bar>
          </GridCell>
        </Grid>
      </Nav>
    </>
  )
}

export default Navigation
