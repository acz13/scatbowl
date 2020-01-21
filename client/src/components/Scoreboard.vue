<template>
  <table class="table card is-fullwidth">
    <thead>
      <tr>
        <th>Pts</th>
        <th>Name</th>
        <th>P</th>
        <th>G</th>
        <th>N</th>
      </tr>
    </thead>
    <transition-group name="flip-list" tag="tbody">
      <tr v-for="player in sortedPlayers" :key="player">
        <td class="has-text-weight-bold">{{ players[player].score }}</td>
        <td class="has-text-weight-bold" :style="{ color: '#' + COLORS[players[player].color].standard}">{{ players[player].username }}</td>
        <td>{{ players[player].powers }}</td>
        <td>{{ players[player].gets }}</td>
        <td>{{ players[player].negs }}</td>
      </tr>
    </transition-group>
  </table>
</template>

<style scoped>
.flip-list-move {
  transition: transform 1s;
}
</style>

<script>
import { COLORS } from 'sb-shared/colors'

export default {
  props: {
    players: Object,
    sortedPlayers: Array
  },
  created () {
    this.COLORS = COLORS
  }
}
</script>
