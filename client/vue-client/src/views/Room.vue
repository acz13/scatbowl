<template>
  <div class="about">
    <h1>This is an about page</h1>
    <b-progress :value="75" size="is-medium" type="is-striped is-animated" show-value>
      3 out of 4
    </b-progress>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  props: {
    public: {
      type: Boolean,
      required: true
    }  
  },
  data: {
    socket: null,
    players: {},
    settings: {}
  },
  created () {
    if (this.socket) { // Shouldn't ever call but just in case
      return
    }

    if (this.public) {
      socket = io(process.env.SCATBOWL_SERVER, { query: { room: this.$route.params.room } })
    }
  },
  beforeRouteUpdate (to, from, next) {
    // called when the route that renders this component has changed,
    // but this component is reused in the new route.
    // For example, for a route with dynamic params `/foo/:id`, when we
    // navigate between `/foo/1` and `/foo/2`, the same `Foo` component instance
    // will be reused, and this hook will be called when that happens.
    // has access to `this` component instance.
    if (!to.public) {
      this.socket.disconnect()

      this.socket = null
    }

    this.socket.emit('join', to.params.room)

    next()
  },
  beforeRouteLeave (to, from, next) {
    // called when the route that renders this component is about to
    // be navigated away from.
    // has access to `this` component instance.
    this.socket.emit("leave")

    next()
  }
}
</script>