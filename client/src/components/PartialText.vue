<template functional>
  <span>
    <template v-for="i in props.wordArray.length">
      <span v-html="props.wordArray[i-1]" :key="i" :class="[i < props.wordsIn ? 'read' : 'unread']"></span>
      {{ ' ' }}
    </template>
  </span>
</template>

<style scoped>
.unread {
  visibility: hidden;
}
</style>
