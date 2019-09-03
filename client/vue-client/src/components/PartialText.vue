<template>
  <span>
    <template v-for="i in Math.min(wordsIn, numWords)">
      <span v-html="wordArray[i-1]" :key="i"></span>
      {{ ' ' }}
    </template>
    <template v-for="i in numWords - Math.min(wordsIn, numWords)">
      <span v-html="wordArray[wordsIn + i - 1]" :key="-i" style="visibility: hidden"></span>
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
    wordArray () {
      return this.text.split(/\s/g)
    },
    numWords () {
      return this.wordArray.length
    }
  },
  watch: {
    wordsIn (val) {
      if (val > this.numWords) {
        this.$emit('reachedEnd')
      }
    }
  }
}
</script>
