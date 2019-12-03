import { reactive, toRefs, computed } from '@vue/composition-api'

export default function timeSync (socket, interval) {
  const syncData = reactive({
    offsets: []
  })

  function sync () {
    socket.emit('timeSync', Date.now(), ({ client, server }) => {
      const off = (server - client + server - Date.now()) / 2

      syncData.offsets.push(off)
    })
  }

  setInterval(sync, interval || 5000)

  const offset = computed(() => {
    return syncData.offsets.reduce((a, b) => a + b) / syncData.offsets.length
  })

  return {
    ...toRefs(syncData),
    sync,
    offset
  }
}
