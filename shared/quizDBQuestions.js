import qs from 'qs'
import makeID from './makeID'

var fetch

if (typeof window === 'undefined' || typeof window.fetch === 'undefined') {
  fetch = require('node-fetch')
} else {
  fetch = window.fetch
}

// Blatantly ripped off from Raynor Kuang's source code
// See https://github.com/UlyssesInvictus/QuizDB/blob/master/client/src/actions/actions.js#L81

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function fetchQuestionsFromQuizDB ({
  searchQuery = '',
  searchFilters = {},
  // Better Defaults for our purposes
  limit = 10,
  random,
  questionType,
  stateKey = null
} = {}) {
  searchFilters = Object.assign({}, searchFilters, { question_type: [questionType] })

  const searchParamsObject = {
    search: {
      query: searchQuery,
      filters: Object.assign({}, searchFilters, { question_type: [questionType] }),
      limit: limit
    }
  }
  let searchEndpoint = 'search'
  if (Number.isInteger(random)) {
    searchParamsObject.search.random = random
    searchEndpoint = 'random'
  }
  const searchQueryString = qs.stringify(searchParamsObject, {
    arrayFormat: 'brackets'
  })
  return fetch(`/api/${searchEndpoint}?${searchQueryString}`)
    .then(
      response => response.json()
    ).then(
      json => fixIDs(json.data.tossups)
    ).catch(
      err => console.log(err)
    )
}

function fixIDs (questions) {
  questions.forEach(question => {
    delete Object.assign(question, { quizdb_id: question.id }).id
    question.order_id = makeID(5)
  })
  return questions
}

export function fetchRandomBonuses (options) {
  return fetchQuestionsFromQuizDB(Object.assign(options, { random: options.limit || 10, questionType: 'Bonus' }))
}

export function fetchRandomTossups (options) {
  return fetchQuestionsFromQuizDB(Object.assign(options, { random: options.limit || 10, questionType: 'Tossup' }))
}
