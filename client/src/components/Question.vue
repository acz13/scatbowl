<template>
  <component :is="revealed ? 'b-collapse' : 'div'" class="card">
    <template v-if="revealed" v-slot:[slotName]="props">
      <div class="card-header" role="button">
        <p class="card-header-title tournaments-list">
          {{ tournament.name }} | {{ category.name }} | {{ subcategory.name }}
        </p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
    </template>
    <div v-else class="card-header">
      <p class="card-header-title tournaments-list">
        {{ tournament.name }} | {{ category.name }} | {{ subcategory.name }}
      </p>
    </div>
    <div class="card-content has-text-left">
      <span v-if="revealed" v-html="formatted_text"></span>
      <PartialText v-else :wordArray="wordArray" :wordsIn="wordsIn"></PartialText>
    </div>
    <footer class="card-footer">
      <div class="card-footer-item answer-container">
        <b>ANSWER:&nbsp;</b>
        <span v-if="revealed" v-html="formatted_answer"></span>
      </div>
    </footer>
  </component>
</template>

<script>
import BCollapse from 'buefy/src/components/collapse/Collapse'
import BIcon from 'buefy/src/components/icon/Icon'

import PartialText from './PartialText'

export default {
  name: 'Question',
  props: {
    type: {
      type: String,
      required: true
    },
    formatted_text: {
      type: String,
      required: true
    },
    formatted_answer: {
      type: String,
      required: true
    },
    tournament: {
      type: Object
    },
    category: {
      type: Object
    },
    subcategory: {
      type: Object
    },
    number: {
      type: Number
    },
    revealed: {
      type: Boolean,
      default: false
    },
    wordsIn: {
      type: Number,
      default: Infinity
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
  components: {
    PartialText,
    BCollapse,
    BIcon
  }
}
</script>
