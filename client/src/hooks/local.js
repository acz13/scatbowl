// This will eventually be offline supported, but currently proxies to QuizDB.org

import { reactive, ref, toRefs } from '@vue/composition-api'

import * as quizDBQuestionManager from '@shared/quizDBQuestions'
import defaultSearchFilters from '@/assets/json/defaultSearchFilters.json'

import checkCorrect from '@shared/answerChecking'
import makeID from '@shared/makeID'

import { useTimer } from '@/hooks/timer'

export function localRoom () {
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
    const toChange = rootKey ? settings[rootKey] : settings

    for (const key in newSettings) {
      toChange[key] = newSettings[key]
    }
  }

  function changeSearchFilters (newSearchFilters) {
    changeSettings(newSearchFilters, 'searchFilters')

    clearQuestions()

    console.log('loading questions')
    loadQuestions(settings)
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
      console.log(err + 'Using default filters')
    })

  // Question management
  const questionQueue = []
  const questionManager = quizDBQuestionManager

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

  const currentQuestion = ref(null)

  const inTransition = ref(false)
  const nextLocked = ref(false)

  async function nextQuestion () {
    if (nextLocked.value) {
      return false
    }

    nextLocked.value = true

    fetchLocked.value = false

    timer.stop()

    if (questionQueue.length === 0) {
      await loadQuestions(settings)
    } else if (questionQueue.length === 1) { // Background
      console.log('loading in background')
      loadQuestions(settings)
        .then(() => console.log('background loaded'))
    }

    if (fetchLocked.value) {
      return false
    }

    try {
      timer.reset()
      inTransition.value = true
      resetReading()

      currentQuestion.value = questionQueue.pop()

      return true
    } catch (e) {
      timer.start()

      return false
    }
  }

  function addMessage (message) {
    if (!currentQuestion) {
      return
    }

    message.id = makeID(5)

    if (currentQuestion.value.hasOwnProperty('messages')) {
      currentQuestion.value.messages.push(message)
    } else {
      currentQuestion.value.messages = [message]
    }
  }

  async function chat (text) {
    addMessage({ text: text, type: chat, sender: 'offline user' })
  }

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

  async function buzz () {
    readingState.buzzing = true
    timer.stop()
  }

  async function submitAnswer (submitted, question) {
    const result = checkCorrect(submitted, question.formatted_answer, question.formatted_text, wordsIn.value)

    readingState.buzzing = false
    finishReading()

    return result
  }

  return {
    settings,
    changeSettings,
    changeSearchFilters,
    filterOptions,

    readingState,

    currentQuestion,
    inTransition,
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
