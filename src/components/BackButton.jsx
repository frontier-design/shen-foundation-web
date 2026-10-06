import styled from 'styled-components'
import { colors, fonts, type } from '../theme.js'
import { goBack } from '../router.jsx'

const Button = styled.button`
  ${type.caption}
  font-family: ${fonts.display};
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 0;
  margin-bottom: clamp(16px, 1.6vw, 24px);
  border: none;
  background: none;
  cursor: pointer;
  color: ${colors.black};
  line-height: 1;
`

// "←" above a page title: back in history, or to `fallback` when the page was
// opened directly.
function BackButton({ fallback }) {
  return (
    <Button type="button" aria-label="Go back" onClick={() => goBack(fallback)}>
      &larr;
    </Button>
  )
}

export default BackButton
