<template>
  <span>
    <template v-for="i in numWords">
      <span v-html="wordArray[i-1]" :key="i" :class="[i < wordsIn ? 'read' : 'unread']"></span>
      {{ ' ' }}
    </template>
  </span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true
    },
    wordsIn: {
      type: Number
    }
  },
  computed: {
    wordArray() {
      return this.text.split(/\s/g);
    },
    numWords() {
      return this.wordArray.length;
    }
  },
  watch: {
    wordsIn(val) {
      if (val > this.numWords) {
        this.$emit("reachedEnd");
      }
    }
  }
};
</script>
