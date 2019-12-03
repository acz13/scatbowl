import { reactive, toRefs, computed } from '@vue/composition-api'

export default function timeSync (socket, interval) {
  const syncData = reactive({
    offsets: [],
    to: null,
    from: null
  })

  function onSync ({ client, server }) {
    const now = Date.now()
    const off = (server - client + server - now) / 2

    syncData.to = server - client
    syncData.from = server - now

    syncData.offsets.push(off)
  }

  socket.on('timeSyncPong', onSync)

  function sync () {
    socket.emit('timeSync', Date.now())
  }

  setInterval(sync, interval || 5000)

  const offset = computed(() => {
    return syncData.offsets.length ? syncData.offsets.reduce((a, b) => a + b) / syncData.offsets.length : null
  })

  return {
    ...toRefs(syncData),
    sync,
    offset
  }
}
