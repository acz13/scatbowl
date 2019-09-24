<template>
  <div class="card down">
    <div class="card-header" @click="toggle">
      <p class="card-header-title tournaments-list">
        {{ tournament.name }} | {{ category.name }} | {{ subcategory.name }}
      </p>
    </div>
    <slide-up-down :open="open" up down>
      <div class="card-content has-background-light has-text-left">
        <span v-if="revealed" v-html="formatted_text"></span>
        <PartialText v-else :wordArray="wordArray" :wordsIn="wordsIn"></PartialText>
      </div>
      <footer class="card-footer">
        <div class="card-footer-item answer-container">
          <b>ANSWER:&nbsp;</b>
          <span v-if="revealed" v-html="formatted_answer"></span>
        </div>
      </footer>
    </slide-up-down>
  </div>
</template>

<script>
// import BCollapse from 'buefy/src/components/collapse/Collapse'
// import BIcon from 'buefy/src/components/icon/Icon'

import SlideUpDown from './SlideUpDown'

import PartialText from './PartialText'

export default {
  name: 'Question',
  data () {
    return {
      open: true
    }
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    formatted_text: {
      type: String,
      default: ''
    },
    formatted_answer: {
      type: String,
      default: ''
    },
    tournament: {
      type: Object,
      default: () => ({})
    },
    category: {
      type: Object,
      default: () => ({})
    },
    subcategory: {
      type: Object,
      default: () => ({})
    },
    number: {
      type: Number,
      default: null
    },
    revealed: {
      type: Boolean,
      default: false
    },
    wordsIn: {
      type: Number,
      default: Infinity
    },
    startClosing: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    wordArray () {
      return this.formatted_text.split(/\s/g)
    },
    numWords () {
      return this.wordArray.length
    },
    slotName () {
      return this.revealed ? 'trigger' : null
    }
  },
  watch: {
    wordsIn () {
      if (this.wordsIn >= this.wordArray.length) {
        this.$emit('reachedEnd')
      }
    }
  },
  mounted () {
    if (this.startClosing) {
      this.$nextTick(() => {
        this.open = false
      })
    }
  },
  methods: {
    toggle () {
      this.open = !this.open
    }
  },
  components: {
    PartialText,
    // BCollapse,
    // BIcon,
    SlideUpDown
  }
}
</script>
