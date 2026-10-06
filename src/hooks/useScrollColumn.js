import { useLayoutEffect } from 'react'
import { historyKey, lastNavigationType } from '../router.jsx'

const positions = new Map()

// For an independently scrolling column: remembers its scroll position per
// history entry (restored on Back/Forward) and sets data-more="above",
// "below" or "both" while there is content past its edges.
export function useScrollColumn(ref, id) {
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const key = `${historyKey()}:${id}`

    const update = () => {
      const above = element.scrollTop > 1
      const below = element.scrollTop + element.clientHeight < element.scrollHeight - 1
      const more = above && below ? 'both' : above ? 'above' : below ? 'below' : ''
      if (element.dataset.more !== more) element.dataset.more = more
    }
    const onScroll = () => {
      positions.set(key, element.scrollTop)
      update()
    }

    if (lastNavigationType() === 'pop' && positions.has(key)) element.scrollTop = positions.get(key)
    update()
    element.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    return () => {
      element.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [ref, id])
}

export default useScrollColumn
