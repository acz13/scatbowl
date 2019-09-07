<template>
  <section class="room section">
    <div class="container">
      <Question
        :wordsIn="wordsIn"
        v-bind="question"
        @reachedEnd="finishReading"
        :revealed="revealAnswer"
        :formatted_answer="revealAnswer ? question.formatted_answer : null"
      ></Question>
      <b-button @click="timer.start">Start Reading</b-button>
      <b-button @click="timer.stop">Stop Reading</b-button>
      <b-button @click="timer.reset">Reset Reading</b-button>
      <p>Words in: {{ wordsIn }} | Offset: {{ timer.offset.value }} | Last Update: {{ timer.debug.lastUpdate % wordDelay }} | Last Timeout: {{ timer.debug.lastTimeout }}</p>
    </div>
  </section>
</template>

<script>
// import io from 'socket.io-client'
import { ref, computed } from '@vue/composition-api'

import BButton from 'buefy/components/src/button/Button'

import Question from '@/components/Question'
import { useTimer } from '@/hooks/timer'

const sampleTossup = {
  id: 89565,
  text:
    'This character considers watching twenty crabs crawl to the sea and stoning the twenty-first, "loving not, hating not, just choosing so." He contemplates a mysterious Gnostic concept called "the Quiet," which "made all things," and concludes seven stanzas with the ominous "so He," after making analogies for another figure who "dwelleth i\' the cold of the moon." This character\'s musings are used to satirize Calvinism and "Natural Theology" in a poem by Robert Browning that has him contemplating Setebos. In another work, this character falls in with the louts Stephano and Trinculo, and this son of the witch Sycorax is enslaved due to his attempted rape of Miranda. For 10 points, name this monstrous slave of Prospero from The Tempest.',
  answer: ' Caliban',
  number: 19,
  tournament_id: 3,
  category_id: 15,
  subcategory_id: 22,
  round: 'Virginia + Dartmouth',
  created_at: '2017-08-27T22:42:37.752Z',
  updated_at: '2017-08-28T03:54:17.132Z',
  quinterest_id: 30049,
  formatted_text:
    '<b>This character considers</b> watching twenty crabs crawl to the sea and stoning the twenty-first, "loving not, hating not, just choosing so." He contemplates a mysterious Gnostic concept called "the Quiet," which "made all things," and concludes seven stanzas with the ominous "so He," after making analogies for another figure who "dwelleth i\' the cold of the moon." This character\'s musings are used to satirize Calvinism and "Natural Theology" in a poem by Robert Browning that has him contemplating Setebos. In another work, this character falls in with the louts Stephano and Trinculo, and this son of the witch Sycorax is enslaved due to his attempted rape of Miranda. For 10 points, name this monstrous slave of Prospero from The Tempest.',
  formatted_answer: ' Caliban',
  wikipedia_url: null,
  url: 'https://www.quizdb.org/api/tossups/89565',
  type: 'tossup',
  tournament: {
    id: 3,
    year: 2012,
    name: '2012 ACF Regionals',
    address: null,
    quality: null,
    type: null,
    link: null,
    created_at: '2017-08-27T18:44:13.219Z',
    updated_at: '2017-08-27T18:44:13.219Z',
    difficulty: 'Regular College',
    difficulty_num: 7,
    url: 'https://www.quizdb.org/api/tournaments/3'
  },
  category: {
    id: 15,
    name: 'Literature',
    created_at: '2017-08-27T19:30:45.876Z',
    updated_at: '2017-08-27T19:30:45.876Z',
    url: 'https://www.quizdb.org/api/categories/15'
  },
  subcategory: {
    id: 22,
    name: 'Literature British',
    created_at: '2017-08-27T19:36:35.094Z',
    updated_at: '2017-08-27T19:36:35.094Z',
    url: 'https://www.quizdb.org/api/subcategories/22'
  }
}

export default {
  props: {
    public: {
      type: Boolean,
      required: true
    }
  },
  setup () {
    const wordDelay = ref(150)

    const { ticks: wordsIn, ...timer } = useTimer(wordDelay)

    function finishReading () {
      timer.stop()
      wordsIn.value = Infinity
    }

    function wpmInput (wpm) {
      wordDelay.value = Math.round(60000 / wpm)
    }

    const revealAnswer = computed(() => {
      return wordsIn === Number.POSITIVE_INFINITY
    })

    timer.start()

    return {
      wordDelay,
      wordsIn,
      timer,
      finishReading,
      wpmInput,
      revealAnswer,
      question: sampleTossup
    }
  },
  // created () {
  //   if (this.socket) { // Shouldn't ever call but just in case
  //     return
  //   }

  //   if (this.public) {
  //     this.socket = io(process.env.SCATBOWL_SERVER, { query: { room: this.$route.params.room } })
  //   }
  // },
  // beforeRouteUpdate (to, from, next) {
  //   // called when the route that renders this component has changed,
  //   // but this component is reused in the new route.
  //   // For example, for a route with dynamic params `/foo/:id`, when we
  //   // navigate between `/foo/1` and `/foo/2`, the same `Foo` component instance
  //   // will be reused, and this hook will be called when that happens.
  //   // has access to `this` component instance.
  //   if (!to.public) {
  //     this.socket.disconnect()

  //     this.socket = null
  //   }

  //   this.socket.emit('join', to.params.room)

  //   next()
  // },
  // beforeRouteLeave (to, from, next) {
  //   // called when the route that renders this component is about to
  //   // be navigated away from.
  //   // has access to `this` component instance.
  //   this.socket.emit('leave')

  //   next()
  // },
  components: {
    Question,
    BButton
  }
}
</script>
