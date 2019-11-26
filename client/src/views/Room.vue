<template>
  <section class="room section">
    <div class="container">
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
          <p>Words in: {{ wordsIn }} | Offset: {{ timer.offset.value }} | Last Update: {{ timer.debug.lastUpdate % settings.wordDelay }} | Last Timeout: {{ timer.debug.lastTimeout }} | startTime: {{ timer.status.startTime }} </p>

          <transition-group name="fade" mode="out-in">
            <b-field v-show="readingState.buzzing || chatting" expanded key="inputs" class="controlfield">
              <b-input
                style="margin-bottom: 0"
                expanded
                ref="submitInput"
                v-model="toSubmit"
                @keydown.native.stop @keyup.native.stop
                @keyup.native.enter.stop="handleSubmit"
              ></b-input>
              <p class="control">
                <button class="button" :class="[readingState.buzzing ? 'is-danger' : 'is-info']" @click="handleSubmit">Submit</button>
              </p>
            </b-field>
            <b-field v-show="!(readingState.buzzing || chatting)" key="buttons" class="controlfield">
              <b-button @click="timer.start">Start Reading</b-button>
              <b-button @click="handleSpace">Buzz</b-button>
              <b-button @click="resetReading">Reset Reading</b-button>
              <b-button @click="nextQuestion">Next Question</b-button>
              <b-button @click="openChat">Chat</b-button>
            </b-field>
          </transition-group>

          <div class="log">
            <div v-show-slide:400:swing:startOpening="open" v-if="currentQuestion" :key="currentQuestion ? currentQuestion.order_id : 'blank'" class="log-item">
              <Question
                class="question mainQuestion"
                :wordsIn="wordsIn"
                v-bind="currentQuestion || {}"
                @reachedEnd="timer.stop"
                :revealed="readingState.revealed"
                ref="mainQuestion"
                :formatted_answer="readingState.revealed ? currentQuestion.formatted_answer : ''"
                :color="currentQuestion.order_id"
              ></Question>
              <ul class="messages" v-if="currentQuestion.messages">
                <li v-for="message in currentQuestion.messages.value" class="sb-message" :key="message.id" v-show-slide:400:swing:startOpening="open">
                  <Message v-bind="message"></Message>
                </li>
              </ul>
            </div>
            <div
              class="log-item"
              v-for="question in questionLog"
              :key="question.order_id"
            >
              <Question
                v-bind="question"
                class="question"
                revealed
                startAction="startClosing"
                :color="question.order_id"
              ></Question>
              <ul class="messages" v-if="question.messages">
                <li v-for="message in question.messages.value" class="sb-message" :key="message.id">
                  <Message v-bind="message"></Message>
                </li>
              </ul>
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
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-leave-active {
  position: absolute;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.controlfield {
  margin-bottom: 0.75rem;
}

.question {
  margin-bottom: 0.75rem;
}

.log-item > *:last-child {
  margin-bottom: 1rem;
  /* display: block; */
}

</style>

<script>
import { ref, computed } from '@vue/composition-api'

import BButton from 'buefy/src/components/button/Button'
import BField from 'buefy/src/components/field/Field'
import BInput from 'buefy/src/components/input/Input'

import Message from '@/components/Message'
import Settings from '@/components/Settings'
import Question from '@/components/Question'
// import SlideUpDown from '@/components/SlideUpDown'

import localRoom from '@/hooks/live'
import { useGlobalKeys } from '@/hooks/globalKeys'

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

      currentQuestion,
      nextLocked,
      nextQuestion,

      chat,
      // addMessage,

      wordsIn,
      timer,

      finishReading,
      resetReading,

      buzz,
      submitAnswer
    } = localRoom(root)

    const questionLog = ref([])
    const logLength = computed(() => questionLog.value.length)

    root.$on('questionLoaded', oldQuestion => {
      if (oldQuestion) {
        window.requestAnimationFrame(() => {
          if (questionLog.value.length >= 15) {
            questionLog.value.pop()
          }
          questionLog.value.unshift(oldQuestion)
          // questionLog.value.push({ component: 'Message', message: 'hello' })
        })
      }
    })

    const submitInput = ref(null)
    const toSubmit = ref('')
    const chatting = ref(null)

    function focusInput () {
      console.log('attempting focus')
      console.log(submitInput.value.$el.querySelector('input'))
      submitInput.value.$el.querySelector('input').focus()
    }

    async function openChat () {
      chatting.value = true
      root.$nextTick(focusInput)
    }

    async function handleSpace (event) {
      event.preventDefault()

      if (!readingState.buzzing) {
        if (await buzz()) {
          root.$nextTick(focusInput)
        }
      }
    }

    async function handleSubmit (event) {
      event.preventDefault()

      if (readingState.buzzing) {
        const result = await submitAnswer(toSubmit.value, currentQuestion.value)

        console.log(result)
      } else if (chatting.value) {
        chat(toSubmit.value)
        chatting.value = false
      }

      toSubmit.value = ''
    }

    const open = ref(true)

    useGlobalKeys({
      keyup: {
        n: nextQuestion,
        '`': () => { open.value = !open.value }
      },
      keydown: {
        ' ': handleSpace,
        '/': openChat
      }
    })

    // nextQuestion()

    return {
      settings,
      changeSettings,
      changeSearchFilters,
      filterOptions,

      readingState,

      questionLog,
      logLength,
      currentQuestion,
      nextLocked,
      nextQuestion,

      wordsIn,
      timer,

      finishReading,
      resetReading,

      focusInput,

      chat,
      chatting,

      toSubmit,
      submitInput,
      openChat,
      handleSpace,
      handleSubmit,

      console,
      open
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
    Message,
    Settings,
    Question,
    BButton,
    BField,
    BInput
    // SlideUpDown
  }
}
</script>
