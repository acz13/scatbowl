<template>
  <section class="room section">
    <div class="container">
      <b-button @click="timer.start">Start Reading</b-button>
      <b-button @click="handleBuzz">Buzz</b-button>
      <b-button @click="resetReading">Reset Reading</b-button>
      <b-button @click="dispNextQuestion">Next Question</b-button>
      <p>Words in: {{ wordsIn }} | Offset: {{ timer.offset.value }} | Last Update: {{ timer.debug.lastUpdate % settings.wordDelay }} | Last Timeout: {{ timer.debug.lastTimeout }}</p>

      <div class="columns">
        <div class="column is-two-thirds">
          <!-- <div tabindex="0" @keydown.space="handleBuzz" @keyup.n="dispNextQuestion">
            <slide-up-down :open="!inTransition" @enter-cancelled="inTransition = true" down class="mainQuestion">
              <Question
                :wordsIn="wordsIn"
                v-bind="currentQuestion || {}"
                @reachedEnd="finishReading"
                :revealed="readingState.revealed"
                ref="mainQuestion"
                :formatted_answer="readingState.revealed ? currentQuestion.formatted_answer : ''"
                @keydown.space="handleBuzz"
                @keydown.n="dispNextQuestion"
              ></Question>
            </slide-up-down>
          </div>-->
          <div class="log">
            <div class="log-item" :key="currentQuestion ? currentQuestion.order_id : 'blank'">
              <slide-up-down up down open startOpening context="mainQuestion">
                {{ currentQuestion ? currentQuestion.order_id : '' }}
                <Question
                  :wordsIn="wordsIn"
                  v-bind="currentQuestion || {}"
                  @reachedEnd="finishReading"
                  :revealed="readingState.revealed"
                  ref="mainQuestion"
                  :formatted_answer="readingState.revealed ? currentQuestion.formatted_answer : ''"
                  @keydown.space="handleBuzz"
                  @keydown.n="dispNextQuestion"
                  startOpening
                ></Question>
              </slide-up-down>
            </div>
            <div
              class="log-item"
              v-for="i in Math.min(logLength, 5)"
              :key="questionLog[logLength - i].order_id"
            >
              {{ questionLog[logLength - i].order_id }}
              <Question
                v-bind="questionLog[logLength - i]"
                revealed
                startClosing
              ></Question>
            </div>
          </div>
        </div>
        <div class="column">
          <settings
            :value="settings"
            :filterOptions="filterOptions"
            @changeSettings="changeSettings"
            @changeSearchFilters="changeSearchFilters($event)"
          ></settings>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mainQuestion {
  /* margin-bottom: 1rem */
}

.log-item {
  margin-top: 3rem;
  display: block;
}
</style>

<script>
import { ref, computed } from '@vue/composition-api'

import BButton from 'buefy/src/components/button/Button'

// import Message from '@/components/Message'
import Settings from '@/components/Settings'
import Question from '@/components/Question'
import SlideUpDown from '@/components/SlideUpDown'

import { localRoom } from '@/hooks/local'

export default {
  props: {
    public: {
      type: Boolean,
      required: true
    }
  },
  setup (_, { root }) {
    const {
      settings,
      changeSettings,
      changeSearchFilters,
      filterOptions,

      readingState,
      handleBuzz,

      nextQuestion,

      wordsIn,
      timer,

      finishReading,
      resetReading
    } = localRoom()

    const questionLog = ref([])
    const logLength = computed(() => questionLog.value.length)

    const currentQuestion = ref(null)

    const inTransition = ref(false)
    const nextLocked = ref(false)

    async function dispNextQuestion () {
      if (nextLocked.value) {
        return
      }

      nextLocked.value = true

      const oldQuestion = currentQuestion.value

      timer.stop()

      try {
        const newQuestion = await nextQuestion()

        timer.reset()

        inTransition.value = true
        resetReading()

        currentQuestion.value = newQuestion
      } catch (e) {
        timer.start()
        return
      }

      window.requestAnimationFrame(() => {
        inTransition.value = false
        nextLocked.value = false

        if (oldQuestion) {
          questionLog.value.push(oldQuestion)
          // questionLog.value.push({ component: 'Message', message: 'hello' })
        }

        timer.start()
      })
    }

    dispNextQuestion().then(() => timer.start())

    return {
      settings,
      changeSettings,
      changeSearchFilters,
      filterOptions,

      readingState,
      handleBuzz,

      questionLog,
      logLength,
      currentQuestion,
      inTransition,
      dispNextQuestion,

      wordsIn,
      timer,

      finishReading,
      resetReading
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
    // Message,
    Settings,
    Question,
    BButton,
    SlideUpDown
  }
}
</script>
