import { reactive, ref, toRefs, onBeforeUnmount } from '@vue/composition-api'

import defaultSearchFilters from '@/assets/json/defaultSearchFilters.json'

import makeID from '@shared/makeID'

import { useTimer } from '@/hooks/timer'

import io from 'socket.io-client'

export default function liveRoom (vm) {
  const socket = io('/', { query: { room: 'mytestingroom' } })
  localStorage.debug = 'socket.io-client:socket'

  onBeforeUnmount(() => {
    socket.close()
  })

  function waitFor (event, fn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out')), 5000)

      socket.once(event, data => {
        clearTimeout(timeout)
        resolve(fn(data))
      })
    })
  }

  // Settings management
  const settings = reactive({
    searchFilters: {
      difficulty: [],
      category: [],
      subcategory: []
    },
    wordDelay: 75
  })

  function changeSettings (newSettings, rootKey) {
    socket.emit('changeSettings', { newSettings, rootKey })
  }

  function changeSearchFilters (newSearchFilters) {
    changeSettings(newSearchFilters, 'searchFilters')
  }

  socket.on('settingsChanged', ({ newSettings, restartInfo }) => {
    for (const key in newSettings) {
      settings[key] = newSettings[key]

      if (key === 'wordDelay') {
        timer.stop()
        timer.start(restartInfo.startTime, restartInfo.resumePoint)
      }
    }
  })

  const filterOptions = ref(defaultSearchFilters)

  fetch(`/api/filter_options`)
    .then(r => {
      return r.json()
    })
    .then(filters => {
      filterOptions.value = filters
    })
    .catch(err => {
      console.log(err + 'Using default filters')
    })

  const currentQuestion = ref(null)

  const nextLocked = ref(false)

  function nextQuestion () {
    if (nextLocked.value) {
      return false
    }

    nextLocked.value = true

    socket.emit('skipQuestion')

    return waitFor('questionLoaded', () => {
      nextLocked.value = false
      return true
    })
  }

  socket.on('questionLoaded', ({ player, question, startTime }) => {
    const oldQuestion = currentQuestion.value
    currentQuestion.value = question
    resetReading()

    vm.$emit('questionLoaded', oldQuestion)

    nextLocked.value = false
    timer.start(startTime)
  })

  function addMessage (message) {
    if (!currentQuestion) {
      return
    }

    message.id = makeID(5)

    if (currentQuestion.value.hasOwnProperty('messages')) {
      currentQuestion.value.messages.unshift(message)
    } else {
      currentQuestion.value.messages = [message]
    }
  }

  async function chat (text) {
    socket.emit('chat', text)
  }

  socket.on('chat', ({ player, message: text }) => {
    addMessage({ text: text, type: chat, sender: player })
  })

  // Buzzing
  const readingState = reactive({
    buzzing: false,
    paused: false,
    revealed: false
  })

  // Timer and Reading
  const { ticks: wordsIn, ...timer } = useTimer(toRefs(settings).wordDelay, true)

  function finishReading () {
    timer.stop()
    readingState.revealed = true
    readingState.buzzing = false

    wordsIn.value = Infinity
  }

  function resetReading () {
    timer.reset()
    readingState.buzzing = false
    readingState.revealed = false
  }

  function buzz () {
    socket.emit('buzz', Date.now())

    return waitFor('playerBuzzed', ({ winner }) => {
      return true
    })
  }

  socket.on('playerBuzzed', ({ winner }) => {
    readingState.buzzing = winner
    timer.stop()
  })

  function submitAnswer (submitted, question) {
    socket.emit('submitAnswer', submitted)

    waitFor('answerSubmitted', () => true)
  }

  return {
    settings,
    changeSettings,
    changeSearchFilters,
    filterOptions,

    readingState,

    currentQuestion,
    nextLocked,
    nextQuestion,

    chat,
    addMessage,

    wordsIn,
    timer,

    finishReading,
    resetReading,

    buzz,
    submitAnswer
  }
}
