import { isRef, reactive, ref, computed, toRefs, watch } from '@vue/composition-api'

export function useTimer (delay) {
  let timeoutID = null

  function clearTimer () {
    clearTimeout(timeoutID)
    timeoutID = null
  }

  const status = reactive({
    startTime: null,
    stopped: true,
    resumePoint: 0,
    delay: null
  })

  const ticks = ref(0)

  const offset = computed(() =>
    status.startTime / status.delay
  )

  const debug = reactive({
    lastUpdate: null,
    lastTimeout: null
  })

  function start (startTime) {
    status.stopped = false

    status.startTime = startTime || Date.now()

    timeoutID = setTimeout(step(), Math.max(status.startTime - Date.now()))
  }

  function step () {
    const now = Date.now()
    debug.lastUpdate = now
    ticks.value =
      Math.floor((now + 3 - status.startTime) / status.delay) +
      status.resumePoint
    if (!status.stopped) {
      const toNext =
        status.delay + 3 - ((now + 3 - offset) % status.delay)
      debug.lastTimeout = toNext

      timeoutID = setTimeout(step, toNext)
    }
  }

  function stop () {
    status.resumePoint = ticks.value

    status.stopped = true
    clearTimer()
  }

  function reset () {
    stop()

    ticks.value = 0
    status.resumePoint = 0
  }

  watch(() => {
    status.delay = isRef(delay) ? delay.value : delay

    if (!status.stopped) {
      stop()

      start()
    }
  })

  return {
    status: toRefs(status),
    debug: toRefs(debug),
    offset,
    ticks,
    start,
    stop,
    reset
  }
}
