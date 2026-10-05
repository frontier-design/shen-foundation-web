import { useSyncExternalStore } from 'react'

const NAVIGATE_EVENT = 'shen:navigate'

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

let keySeq = 0
const newKey = () => `${Date.now().toString(36)}-${(keySeq++).toString(36)}`
if (!window.history.state?.key) window.history.replaceState({ ...window.history.state, key: newKey() }, '')

let lastNavigation = 'load'
window.addEventListener('popstate', () => {
  lastNavigation = 'pop'
})

export function historyKey() {
  return window.history.state?.key ?? null
}

export function lastNavigationType() {
  return lastNavigation
}

const subscribe = (callback) => {
  window.addEventListener('popstate', callback)
  window.addEventListener(NAVIGATE_EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(NAVIGATE_EVENT, callback)
  }
}

export function usePathname() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  )
}

export function navigate(to) {
  if (to === window.location.pathname) return
  lastNavigation = 'push'
  window.history.pushState({ key: newKey() }, '', to)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

export function goBack(fallback = '/') {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigate(fallback)
  }
}

export function linkProps(to) {
  return {
    href: to,
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      navigate(to)
    },
  }
}
