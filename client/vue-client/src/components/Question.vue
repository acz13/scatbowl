<template>
  <b-collapse class="card">
    <div slot="trigger" slot-scope="props" class="card-header" role="button">
      <p
        class="card-header-title"
      >{{ tournament.name }} | {{ category.name }} | {{ subcategory.name }}</p>
      <a class="card-header-icon">
        <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
      </a>
    </div>
    <div class="card-content has-text-left">
      <PartialText :text="formatted_text" :wordsIn="wordsIn" v-on="$listeners"></PartialText>
    </div>
    <footer class="card-footer">
      <div class="card-footer-item answer-container">
        <b>ANSWER:</b>
        <span v-if="showAnswer" v-html="formatted_answer"></span>
      </div>
    </footer>
  </b-collapse>
</template>

<script>
import PartialText from "./PartialText";

export default {
  name: "Question",
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
      default: Infinity
    }
  },
  computed: {},
  components: {
    PartialText
  }
};
</script>
