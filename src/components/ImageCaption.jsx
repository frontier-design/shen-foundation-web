import styled from 'styled-components'
import { GRID } from '../grid'
import { colors, type, easing, duration } from '../theme.js'

// Caption over the bottom of an image: fades in while its parent is hovered,
// always shown where there is no hover (phones, tablets). The parent must be
// positioned.
const Overlay = styled.figcaption`
  ${type.caption}
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: clamp(48px, 8vw, 88px) clamp(16px, 2vw, 28px) clamp(16px, 2vw, 28px);
  color: ${colors.lightGray};
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgba(18, 18, 18, 0.75) 0%,
    rgba(18, 18, 18, 0.7) 40%,
    rgba(18, 18, 18, 0) 100%
  );
  transition: opacity ${duration.base}s ${easing.reveal};

  span {
    display: block;
    max-width: 80%;
    transform: translateY(1em);
    transition: transform ${duration.base}s ${easing.reveal};

    @media ${GRID.MEDIA_TABLET} {
      max-width: none;
    }
  }

  *:hover > & {
    opacity: 1;
  }

  *:hover > & span {
    transform: translateY(0);
  }

  @media (hover: none) {
    opacity: 1;

    span {
      transform: none;
    }
  }
`

function ImageCaption({ children }) {
  if (!children) return null
  return (
    <Overlay>
      <span>{children}</span>
    </Overlay>
  )
}

export default ImageCaption
