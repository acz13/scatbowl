<template>
  <b-collapse class="card">
    <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button">
        <p class="card-header-title">
            Component
        </p>
        <a class="card-header-icon">
            <b-icon
                :icon="props.open ? 'menu-down' : 'menu-up'">
            </b-icon>
        </a>
    </div>
    <div class="card-content has-text-left">
      <p v-if="wordsIn >= 0">
        <PartialText :text="formatted_text" :wordsIn="wordsIn" v-on="$listeners" />
      </p>
      <p v-else-if="wordsIn === -1" v-html="formatted_text"></p>
    </div>
    <footer class="card-footer">
      <div class="card-footer-item answer-container">
        <b>ANSWER:</b> <span v-if="showAnswer" v-html="formatted_answer"></span>
      </div>
    </footer>
  </b-collapse>
</template>

<script>
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
    showAnswer: {
      type: Boolean,
      default: false
    },
    wordsIn: {
      type: Number,
      default: -1
    }
  },
  components: {
    PartialText
  }
}
</script>
