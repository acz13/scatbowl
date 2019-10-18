import { onMounted, onBeforeUnmount } from '@vue/composition-api'

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
  const listeners = {}
  const addEventListener = type => {
    listeners[type] = window.addEventListener(type, event => globalKeyHandler(handlers[type], event))
  }

  onMounted(() => {
    for (const type in handlers) {
      addEventListener(type)
    }
  })

  onBeforeUnmount(() => {
    for (const type in listeners) {
      window.removeEventListener(type, listeners(type))
    }
  })
}
