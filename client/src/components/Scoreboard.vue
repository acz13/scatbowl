<template functional>
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
      <tr v-for="player in props.sortedPlayers" :key="player">
        <td>{{ props.players[player].score }}</td>
        <td>{{ player }}</td>
        <td>{{ props.players[player].powers}}</td>
        <td>{{ props.players[player].gets }}</td>
        <td>{{ props.players[player].negs }}</td>
      </tr>
    </transition-group>
  </table>
</template>

<style scoped>
.flip-list-move {
  transition: transform 1s;
}
</style>
