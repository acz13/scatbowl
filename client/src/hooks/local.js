// This will eventually be offline supported, but currently proxies to QuizDB.org

import { reactive, ref, toRefs } from '@vue/composition-api'

import quizDBQuestionManager from '@shared/quizDBQuestions'
import defaultSearchFilters from '@/assets/json/defaultSearchFilters.json'

import { useTimer } from '@/hooks/timer'

export function localRoom () {
  // Settings management
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

  // Buzzing
  const readingState = reactive({
    buzzing: false,
    paused: false,
    revealed: false
  })

  function handleBuzz (event) {
    if (event) {
      event.preventDefault()
    }

    if (readingState.buzzing) {
      readingState.revealed = true
    } else {
      readingState.buzzing = true
      timer.stop()
    }
  }

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

  async function nextQuestion () {
    fetchLocked.value = false

    if (questionQueue.length === 0) {
      await loadQuestions(settings)
    } else if (questionQueue.length === 1) { // Background
      console.log('loading in background')
      loadQuestions(settings)
        .then(() => console.log('background loaded'))
    }

    if (fetchLocked.value) {
      return
    }

    return questionQueue.pop()
  }

  // Timer and Reading
  const { ticks: wordsIn, ...timer } = useTimer(toRefs(settings).wordDelay, true)

  function finishReading () {
    timer.stop()
    wordsIn.value = Infinity
  }

  function resetReading () {
    timer.reset()
    readingState.buzzing = false
    readingState.revealed = false
  }

  return {
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
  }
}
