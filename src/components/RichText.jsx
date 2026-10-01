import { Fragment, cloneElement, createElement, useMemo } from 'react'
import DOMPurify from 'dompurify'
import styled from 'styled-components'
import { fontWeight } from '../theme.js'
import { linkProps } from '../router.jsx'
import { isHtml, textToHtml, toPlainText } from '../content.js'

const OUTPUT_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li']

const RENAMED = {
  b: 'strong',
  i: 'em',
  h1: 'p',
  h2: 'p',
  h3: 'p',
  h4: 'p',
  h5: 'p',
  h6: 'p',
}

const BLOCK_OR_PARAGRAPH = ['blockquote', 'pre', 'td', 'th']

const UNWRAPPED = ['u', 's', 'strike', 'del', 'ins', 'code', 'span', 'mark', 'sub', 'sup', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'div']

const BLOCK_TAGS = new Set(['p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'table', 'div'])

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [...OUTPUT_TAGS, ...Object.keys(RENAMED), ...BLOCK_OR_PARAGRAPH, ...UNWRAPPED],
  ALLOWED_ATTR: ['href'],
  RETURN_DOM_FRAGMENT: true,
}

const Root = styled.div`
  & > * + *,
  & li > * + * {
    margin-top: 1.5em;
    margin-top: 1lh;
  }

  strong {
    font-weight: ${fontWeight.bold};
  }

  em {
    font-style: italic;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }

  ul,
  ol {
    padding-left: 1.25em;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }
`

function linkAttrs(href) {
  if (!href) return {}
  let url
  try {
    url = new URL(href, window.location.href)
  } catch {
    return {}
  }
  const web = url.protocol === 'http:' || url.protocol === 'https:'
  if (web && url.origin === window.location.origin) {
    return linkProps(`${url.pathname}${url.search}${url.hash}`)
  }
  if (web) return { href: url.href, target: '_blank', rel: 'noopener noreferrer' }
  return { href }
}

function hasBlockChild(el) {
  return [...el.children].some((child) => BLOCK_TAGS.has(child.tagName.toLowerCase()))
}

function toReact(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const source = node.tagName.toLowerCase()
  const children = [...node.childNodes].map((child, i) => toReact(child, i))

  let tag = RENAMED[source] || source
  if (BLOCK_OR_PARAGRAPH.includes(source)) tag = hasBlockChild(node) ? null : 'p'
  if (!tag || UNWRAPPED.includes(tag)) return <Fragment key={key}>{children}</Fragment>
  if (tag === 'br') return <br key={key} />
  if (tag === 'a') {
    const attrs = linkAttrs(node.getAttribute('href'))
    if (!attrs.href) return <Fragment key={key}>{children}</Fragment>
    return createElement('a', { key, ...attrs }, children)
  }
  return createElement(tag, { key }, children)
}

function render(html) {
  const source = isHtml(html) ? html : textToHtml(html)
  const fragment = DOMPurify.sanitize(source, PURIFY_CONFIG)
  return [...fragment.childNodes].map((node, i) => toReact(node, i)).filter((n) => n !== null && n !== '')
}

function withTrailing(nodes, trailing) {
  if (!trailing) return nodes
  const last = nodes[nodes.length - 1]
  if (last?.type === 'p') {
    return [...nodes.slice(0, -1), cloneElement(last, undefined, last.props.children, ' ', trailing)]
  }
  return [...nodes, <p key="trailing">{trailing}</p>]
}

function RichText({ html, trailing, className }) {
  const nodes = useMemo(() => (toPlainText(html) ? render(html) : []), [html])
  if (!nodes.length) return null
  return <Root className={className}>{withTrailing(nodes, trailing)}</Root>
}

export default RichText
