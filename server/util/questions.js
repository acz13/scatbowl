const qs = require('qs')
const fetch = require('node-fetch')

// eventually this will be replaced with a function to search for the question
function fetchRandomTossup () {
  return new Promise((resolve, reject) => {
    const genText = "This work argues that raises in average wages have led luxury goods to be considered costumer “needs” in what is called the “dependence effect,” and it uses the term “social balance” to refer to the proper relationship between private and public spending. It advocates an increase in public spending in education to help foster a “new class” of workers who enjoy their jobs. Originally titled “Why the Poor are Poor,” this work forms a trilogy with its author's other books American Capitalism and The New Industrial State and introduces the term “conventional wisdom.” For 10 points, name this book reevaluating the American economy, by John Galbraith."
    const genAnswer = 'Epstein-Barr virus or EBV [accept human herpesvirus-4]'
    const genCategory = 22
    const genSubcategory = null

    setTimeout(() => resolve([{
      type: 'tossup',
      text: genText,
      answer: genAnswer,
      category: genCategory,
      subcategory: genSubcategory
    }]), 250)
  })
}

function fetchRandomBonus () {
  return new Promise((resolve, reject) => {
    const genLeadin = "This work argues that raises in average wages have led luxury goods to be considered costumer “needs” in what is called the “dependence effect,” and it uses the term “social balance” to refer to the proper relationship between private and public spending. It advocates an increase in public spending in education to help foster a “new class” of workers who enjoy their jobs. Originally titled “Why the Poor are Poor,” this work forms a trilogy with its author's other books American Capitalism and The New Industrial State and introduces the term “conventional wisdom.” For 10 points, name this book reevaluating the American economy, by John Galbraith."
    const parts = [
      { text: 'blah', answer: 'Florence Nightingale', number: 1 },
      { text: 'blah2', answer: 'Moby Dick', number: 2 },
      { text: 'blah3', answer: 'Everson vs. Board of Education', number: 3 }
    ]

    const genCategory = 22
    const genSubcategory = null

    setTimeout(() => resolve([{
      type: 'bonus',
      leadin: genLeadin,
      parts: parts,
      category: genCategory,
      subcategory: genSubcategory
    }]), 250)
  })
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
  random = 10,
  questionType = 'Tossup',
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
  return fetch(`https://www.quizdb.org/api/${searchEndpoint}?${searchQueryString}`)
    .then(
      response => response.json(),
      error => console.log('QuizDB: an error occurred.', error)
    ).then(json => fixIDs(json.data.tossups))
     .catch(err => console.log(err))
}

function fixIDs (questions) {
  questions.forEach(question =>
    delete Object.assign(question, { quizdb_id: question.id })['id']
  )
  return questions
}

module.exports = {
  fetchRandomTossup,
  fetchRandomBonus,
  fetchQuestionsFromQuizDB
}
