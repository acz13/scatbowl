<template>
  <section class="room section">
    <div class="container">
      <b-button @click="timer.start">Start Reading</b-button>
      <b-button @click="timer.stop">Stop Reading</b-button>
      <b-button @click="timer.reset">Reset Reading</b-button>
      <b-button @click="nextQuestion">Next Question</b-button>
      <p>Words in: {{ wordsIn }} | Offset: {{ timer.offset.value }} | Last Update: {{ timer.debug.lastUpdate % settings.wordDelay }} | Last Timeout: {{ timer.debug.lastTimeout }}</p>

      <div class="columns">
        <div class="column is-two-thirds">
          <slide-up-down :open="!inTransition" down>
            <Question
              :wordsIn="wordsIn"
              v-bind="currentQuestion || {}"
              @reachedEnd="finishReading"
              :revealed="revealAnswer"
              v-show="!inTransition"
              :formatted_answer="revealAnswer ? currentQuestion.formatted_answer : ''"
            ></Question>
          </slide-up-down>
          <template v-for="i in Math.min(logLength, 10)">
            <Question
              v-bind="questionLog[logLength - i]"
              :key="logLength - i"
              revealed
              startClosing
            ></Question>
          </template>
        </div>
        <div class="column">
          <settings
            :value="settings"
            :filterOptions="filterOptions"
            @changeSettings="changeSettings"
            @changeSearchFilters="changeSettings($event, 'searchFilters'); clearQuestions(); loadQuestions()">
          </settings>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .question-list-enter {
    /* transition: transform 3s; */
  }
</style>

<script>
// import io from 'socket.io-client'
import { ref, reactive, computed, toRefs } from '@vue/composition-api'

import BButton from 'buefy/src/components/button/Button'

import Settings from '@/components/Settings'
import Question from '@/components/Question'
import SlideUpDown from '@/components/SlideUpDown'

import { useTimer } from '@/hooks/timer'

import quizDBQuestionManager from '@shared/quizDBQuestions'
import defaultSearchFilters from '@/assets/json/defaultSearchFilters.json'

/**
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
*/

export default {
  props: {
    public: {
      type: Boolean,
      required: true
    }
  },
  setup (_, { root }) {
    // Settings
    const settings = reactive({
      searchFilters: {
        difficulty: [],
        category: [],
        subcategory: []
      },
      wordDelay: 25
    })

    function changeSettings (newSettings, rootKey) {
      const toChange = rootKey ? settings[rootKey] : settings

      for (const key in newSettings) {
        toChange[key] = newSettings[key]
      }
    }

    const filterOptions = ref(defaultSearchFilters)

    fetch(`/api/filter_options`)
      .then(r => {
        return r.json()
      })
      .then(filters => {
        filterOptions.value = filters
      })
      .catch(err => {
        console.log(err + 'Default filters')
      })

    // Question management
    const questionQueue = []
    const questionManager = quizDBQuestionManager

    const nextLocked = ref(false)
    const fetchLocked = ref(false)

    function clearQuestions () {
      questionQueue.length = 0
      fetchLocked.value = true
    }

    async function loadQuestions (options = {}) {
      if (fetchLocked.value) {
        return
      }

      const newQuestions = await questionManager.fetchRandomTossups(options)

      if (fetchLocked.value) {
        return
      }

      questionQueue.push(...newQuestions)
    }

    const questionLog = ref([])
    const logLength = computed(() => questionLog.value.length)

    const currentQuestion = ref(null)

    const inTransition = ref(false)

    async function nextQuestion () {
      if (nextLocked.value) {
        return
      }

      nextLocked.value = true
      fetchLocked.value = false

      if (questionQueue.length === 0) {
        await loadQuestions(settings)
      } else if (questionQueue.length === 1) {
        loadQuestions(settings) // Background
      }

      if (fetchLocked.value) {
        return
      }

      const oldQuestion = currentQuestion.value

      timer.reset()
      currentQuestion.value = questionQueue.pop()

      nextLocked.value = false

      inTransition.value = true

      if (oldQuestion) {
        questionLog.value.push(oldQuestion)
      }

      window.requestAnimationFrame(() => {
        inTransition.value = false
        timer.start()
      })
    }

    // Timer and Reading
    const { ticks: wordsIn, ...timer } = useTimer(toRefs(settings).wordDelay, true)

    function finishReading () {
      timer.stop()
      wordsIn.value = Infinity
    }

    const revealAnswer = computed(() => {
      return wordsIn.value === Number.POSITIVE_INFINITY
    })

    nextQuestion().then(() => timer.start())

    return {
      settings,
      changeSettings,
      filterOptions,
      wordsIn,
      timer,
      finishReading,
      revealAnswer,
      currentQuestion,
      nextQuestion,
      questionLog,
      clearQuestions,
      loadQuestions,
      nextLocked,
      inTransition,
      logLength
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
    Settings,
    Question,
    BButton,
    SlideUpDown
  }
}
</script>
