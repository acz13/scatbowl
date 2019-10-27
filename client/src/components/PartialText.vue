<!--
Updating this component so often is too slow.
should manipulate the DOM directly from JS instead of using Vue for this case.
-->

<template functional>
  <span>
    <template v-for="i in props.wordArray.length">
      <span v-html="props.wordArray[i-1].text" :key="i" :class="{unread: i >= props.wordsIn, ...props.wordArray[i-1].classes}"></span>
      {{ ' ' }}
    </template>
  </span>
</template>

<style scoped>
.unread {
  visibility: hidden;
}

.strong, .b {
  font-weight: bold;
}

.em {
  font-style: italic;
}

.u {
  text-decoration: underline;
}
</style>
