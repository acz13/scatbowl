function globalKeyHandler (handlers, event) {
  if (typeof handlers === 'undefined') {
    return
  }

  if (event.defaultPrevented) {
    return
  }

  if (handlers.hasOwnProperty(event.key)) {
    handlers[event.key](event)
  }
}

export function useGlobalKeys (handlers) {
  window.addEventListener('keyup', event => globalKeyHandler(handlers.keyup, event))
  window.addEventListener('keydown', event => globalKeyHandler(handlers.keydown, event))
  window.addEventListener('keypress', event => globalKeyHandler(handlers.keypress, event))
}
