<template functional>
  <span>
    <template v-for="i in numWords">
      <span v-html="wordArray[i-1]" :key="i" :class="[i < wordsIn ? 'read' : 'unread']"></span>
      {{ ' ' }}
    </template>
  </span>
</template>

<style scoped>
.unread {
  visibility: hidden;
}
</style>
