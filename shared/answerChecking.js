Object.defineProperty(Array.prototype, 'flat', {
  value: function (depth = 1) {
    return this.reduce(function (flat, toFlatten) {
      return flat.concat((Array.isArray(toFlatten) && (depth > 1)) ? toFlatten.flat(depth - 1) : toFlatten)
    }, [])
  }
})

function wordInAnswer (word, list, allowAbrev) {
  return (list.some(elem => {
    return (distance(word, elem, allowAbrev) > 0.85)
  }))
}

function checkCorrect (submitted, actual, displayedText, questionText) {
  const [promptList, noAcceptList, acceptList, boldedAnswer, mistakesPromptList, mistakesNoAcceptList, mistakesAcceptList] = setAnswerInfo(actual)
  // do preliminary tests -- allows for finding anomalies like "the invisible man" vs "invisible man", they're slightly less accurate but should be fine
  const distances = [].concat(...[mistakesPromptList, mistakesNoAcceptList, mistakesAcceptList]).map(elem => distance(submitted, elem))

  let max = distances[0]
  let maxIndex = 0
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] > max) {
      maxIndex = i
      max = distances[i]
    }
  }
  /*
  if there is an answer that is close figure out which type of answer it is and return that
  */
  if (max > 0.85) {
    if (maxIndex < mistakesPromptList.length) {
      return ('prompt')
    } else if (maxIndex < mistakesPromptList.length + mistakesNoAcceptList.length) {
      return ('wrong')
    } else {
      return ('correct')
    }
  }

  displayedText = fixAnswer(displayedText).split(' ')
  // displayedText=displayedText.split(" ");
  questionText = questionText.toLowerCase()

  const allOkayWords = [].concat(...[promptList, acceptList, displayedText.slice(-15).map(elem => [fixAnswer(elem)])]).flat()

  const submittedAnswer = fixAnswer(submitted, questionText).split(' ')

  const whatToDo = ''
  let toReturn

  // ANSWER INCORRECT CHECK

  // check if this is true for any answer that shouldn't be accepted
  if (noAcceptList.some(noAcceptAnswer => {
    const allowAbrev = noAcceptAnswer.length > 1
    // check if every word from the wrong answer is in the submitted answer
    return (
      noAcceptAnswer.every(elem => {
        return (wordInAnswer(elem, submittedAnswer, allowAbrev))
      }) &&
      // check if every word from the submitted answer is in the wrong answer
        submittedAnswer.every(elem => {
          return (wordInAnswer(elem, noAcceptAnswer, allowAbrev))
        })
    )
  })) {
    return ('wrong')
  }

  // ANSWER PROMPT CHECK

  // check if this is true for any answer that should be prompted
  if (promptList.some(promptAnswer => {
    const allowAbrev = promptAnswer.length > 1

    const stillGood = isStillGood(promptAnswer, displayedText)
    if (stillGood) {
      if (stillGood !== true) {
        promptAnswer = stillGood
      }
    } else {
      return (false)
    }

    return (
      // check if every word from the prompt answer is in the submitted answer
      promptAnswer.every(elem => {
        return (wordInAnswer(elem, submittedAnswer, allowAbrev))
      }) &&
      // check if every word from the submitted answer is in an okay answer
      submittedAnswer.every(elem => {
        return (wordInAnswer(elem, allOkayWords, allowAbrev))
      })
    )
  })) {
    return ('prompt')
  }

  // ANSWER CORRECT CHECK
  // console.log(acceptList);

  let toPrompt = false
  // check if this is true for any answer that should be correct
  if (acceptList.some(acceptAnswer => {
    const allowAbrev = acceptAnswer.length > 1
    const stillGood = isStillGood(acceptAnswer, displayedText)
    if (stillGood) {
      if (!stillGood) {
        acceptAnswer = stillGood
      }
    } else {
      return (false)
    }
    if (
      // check if every word from the submitted answer is in an okay answer
      ((submittedAnswer.every(elem => {
        return (wordInAnswer(elem, allOkayWords, allowAbrev))
      }))) &&
      // check if at least 2 words from the correct answer are in the submitted answer, or the correct answer is just 1 word
      acceptAnswer.filter(elem => {
        return (wordInAnswer(elem, submittedAnswer, allowAbrev))
      }).length > (allowAbrev ? 1 : 0)
    ) {
      return (true)
    }
    const lastWordSame = (distance(submittedAnswer.slice(-1)[0], acceptAnswer.slice(-1)[0], false))
    // else if the last word is the same, if it's a person then it's right, otherwise prompt
    if (lastWordSame > 0.85) {
      if (questionText.includes('this person') || questionText.includes('this man') || questionText.includes('this woman') || questionText.includes('this author') || questionText.includes('this writer') || questionText.includes('this poet') || questionText.includes('this painter') || questionText.includes('this sculptor') || questionText.includes('this pyhsicist') || questionText.includes('this composer')) {
        return (true)
      } else if (!(questionText.includes('this book') || questionText.includes('this novel') || questionText.includes('this poem') || questionText.includes('this short story') || questionText.includes('this story'))) { // prompt if last word is right unless it's a book because then it needs exact
        toPrompt = true
        return (false)
      }
    } else {
      return false
    }
  })) {
    return ('correct')
  } else if (toPrompt) {
    return ('prompt')
  } else {
    return ('wrong')
  }
}

function isStillGood (answer, text) {
  // if the answer can only be accepted at some time
  if ((answer.includes('until') || answer.includes('before'))) {
    console.log('here')
    const index = answer.indexOf('before') > -1 ? answer.indexOf('before') : answer.indexOf('until') // sees if the words to buzz before exist in the displayedText
    const textJoined = text.join(' ')
    if (!answer.slice(index, 1).some((elem) => textJoined.includes(elem))) {
      // removes all the packet junk after "before" or "accept"
      return (answer.slice(index, answer.length))
    } else {
      // answer can't be accepted at this point in the question
      return (false)
    }
  } else {
    return (true)
  }
}

function setAnswerInfo (fullText, questionText) {
  // fullText is full answer
  let correctAnswers = []
  let incorrectAnswers = []
  let promptAnswers = []

  fullText = fullText.toLowerCase()

  let bolded = fullText.replace(/ *\[[^\]]*]/g, '') // removes text between []
  bolded = bolded.replace(/\s*\(.*?\)\s*/g, '') // removes text between ()
  bolded = bolded.replace(/(\{.*?\})/g, '') // removes text between {}

  if (bolded.includes('/')) {
    bolded.split('/').forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).split(' ')))
  }
  if (bolded.includes(' or ')) {
    bolded.split(' or ').forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).split(' ')))
  }
  if (bolded.includes('-')) {
    correctAnswers.push(fixAnswer(bolded.replace('-', ' '), questionText).split(' '))
  }

  // if there is bolded text then that becomes the bolded text
  bolded = (/<b>(.*?)<\/b>/.exec(bolded) != null ? /<b>(.*?)<\/b>/.exec(bolded)[1] : bolded)
  bolded = bolded.replace(/(<.*?>)/g, '') // removes text between <>
  bolded = bolded.replace(/(<.*?>)/g, '') // removes text between < and >  which occurs sometimes instead of <>

  const [mistakesIncorrectAnswers, mistakesPromptAnswers, mistakesCorrectAnswers] = commonAnswerMistakes(bolded)

  correctAnswers.push(fixAnswer(bolded, questionText).split(' '))

  fullText = fullText.replace(/\[/g, '(').replace(/\]/g, ')') // replace brackets with parentheses to make later things easier
  const re = /\((.*)\)/i
  fullText = fullText.match(re) != null ? fullText.match(re)[0].replace(/\(/g, '').replace(/\)/g, '') : '' // get text between parentheses, regex returns it with parentheses, so those are then removed

  fullText = 'accept ' + fullText
  // split on prompts and accepts, trim every element, then remove blanks
  fullText = fullText.split(/(prompt|accept)+/).map((elem) => elem.trim()).filter((elem) => {
    // if it's empty, remove it
    return (elem !== '')
  })

  let tempTxt = []
  for (let i = 0; i < fullText.length; i++) {
    if (fullText[i] !== 'accept' && fullText[i] !== 'prompt') {
      // split on "," , "or" , and ";", trim every element, then remove blanks
      const wordsMinusDash = []
      tempTxt = (' ' + fullText[i]).split(/,| or |;|\//).map((elem) => { if (elem.includes('-')) { wordsMinusDash.push(elem.replace(/-/g, ' ')) } return (elem.trim()) }).filter((elem) => {
        // if it's empty, remove it
        return (elem !== '')
      })

      wordsMinusDash.forEach(elem => tempTxt.push(elem))

      if (fullText[i - 1] === 'accept') {
        if (fullText[i - 2] != null ? fullText[i - 2].split(' ').slice(-1)[0] === 'not' : false) { // if it is wrong
          tempTxt.forEach((elem) => incorrectAnswers.push(fixAnswer(elem, questionText).trim().split()))
        } else {
          tempTxt.forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).trim().split(' ')))
        }
      } else {
        tempTxt.forEach((elem) => promptAnswers.push(fixAnswer(elem, questionText).trim().split(' ')))
      }
    }
  }

  // remove all empty elements
  promptAnswers = promptAnswers.filter((elem) => {
    return (elem !== '')
  })
  incorrectAnswers = incorrectAnswers.filter((elem) => {
    return (elem !== '')
  })
  correctAnswers = correctAnswers.filter((elem) => {
    return (elem !== '')
  })

  return [promptAnswers, incorrectAnswers, correctAnswers, bolded, mistakesPromptAnswers, mistakesIncorrectAnswers, mistakesCorrectAnswers]
}

function commonAnswerMistakes (answer) {
  const correctAnswers = []
  const incorrectAnswers = []
  const promptAnswers = []

  if (answer === 'the invisible man') {
    incorrectAnswers.push('invisible man')
  }
  if (answer === 'invisible man') {
    incorrectAnswers.push('the invisible man')
  }
  return ([incorrectAnswers, promptAnswers, correctAnswers])
}

function fixAnswer (answer, questionText) {
  if (questionText == null) {
    questionText = ''
  } else {
    questionText = questionText.toLowerCase()
  }
  answer = answer.trim()
  answer = answer.toLowerCase()

  // remove grammar
  answer = answer.replace(/[^A-Za-z0-9\s]/g, '')

  let answerWords = answer.split(' ')
  // general stop words -- make sure i isn't included
  const stopWords = ['like', 'law', 'experiment', 'answers', 'required', 'king', 'queen', 'unless', 'type', 'word', 'forms', 'equivalent', 'more', 'this', 'anything', 'related', 'name', 'which', 'includes', 'any', 'underlined', 'bolded', 'portion', 'partial', 'answer', 'it', "it's", 'its', 'they', 'them', 'a', 'their', 'what', 'mention', 'mentioned', 'who', 'which', 'that', 'grudgingly', 'begrudgingly', 'involving', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'specific', 'specifics', 'has', 'have', 'had', 'do', 'does', 'did', 'a', 'an', 'but', 'if', 'or', 'as', 'because', 'specifically', 'etc', 'afterwards', 'force', 'de', 'la', 'el', 'of', 'at', 'by', 'for', 'theory', 'with', 'about', 'during', 'after', 'to', 'in', 'on', 'now', 'then', 'once', 'there', 'when', 'why', 'how', 'all', 'any', 'both', 'more', 'other', 'otherwise', 'most', 'suuch', 'as', 'no', 'not', 'only', 'same', 'some', 'so', 'can', "don't", 'will', 'just', 'should', 'the', 'no.', 'no', 'number', 'vitamin', 'vitamins', 'effect']
  // remove stop words
  if (answerWords.length - 1 > 0) { // check to make sure it's not some weird question with a stop word as the answers
    if (questionText.includes('this book') || questionText.includes('this novel') || questionText.includes('this poem') || questionText.includes('this short story') || questionText.includes('this story')) { // since books/novels/poems actually cares about stop words after the beginning because it's generally a work, only remove beginning stop words -- didn't include "this work" because music often has stop words
      stopWords.forEach((stopWord) => {
        if (distance(answerWords[0], stopWord) > 0.85) {
          answerWords.shift()
        }
      })
    } else {
      answerWords = answerWords.map((answerWord) => {
        let whatToReturn = answerWord
        stopWords.forEach((stopWord) => {
          if (distance(answerWord, stopWord) > 0.85) {
            whatToReturn = ''
          }
        })
        return (whatToReturn)
      })
    }
  }

  // removes any elements that were set to blank
  answerWords = answerWords.filter((elem) => {
    return elem !== ''
  })

  // deal with numbers
  answerWords = answerWords.map((answerWord) => {
    // convert roman numerals to numbers
    if (!/[^\sxiv]/i.test(answerWord)) { // if the word only has x, i, and v in it
      return (convertFromRoman(answerWord).toString())
    }

    // remove suffixes from numbers
    answerWord = answerWord.replace(/(\d+)(st|nd|rd|th)/, '$1')
    // convert text to numbers
    const ordinalNumbers = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty first']
    const cardinalNumbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty one']

    for (let i = 0; i < ordinalNumbers.length; i++) {
      if (distance(answerWord, ordinalNumbers[i]) > 0.85) {
        return (i.toString())
      }
    }
    for (let i = 0; i < cardinalNumbers.length; i++) {
      if (distance(answerWord, cardinalNumbers[i]) > 0.85) {
        return (i.toString())
      }
    }
    return (answerWord)
  })

  // if any words end in "s", "ing", or "ed", remove that ending
  answerWords = answerWords.map((word) => removeEndings(word))
  answer = answerWords.join(' ')

  // turn accept or prompt and prompt or accept into just accept -- this is for when they say "do not accept or prompt on"
  answer.replace(/prompt or accept/g, 'accept')
  answer.replace(/accept or prompt/g, 'accept')

  // replace anti-prompt with prompt cuz i'm to lazy to add a separate case
  answer.replace(/antiprompt/g, 'prompt')
  answer.replace(/anti prompt/g, 'prompt')
  answer.replace(/anti-prompt/g, 'prompt')

  return (answer.trim())
}

function convertFromRoman (str) {
  var result = 0
  // the result is now a number, not a string
  var decimal = [10, 9, 5, 4, 1]
  var roman = ['x', 'ix', 'v', 'iv', 'i']
  for (var i = 0; i <= decimal.length; i++) {
    while (str.indexOf(roman[i]) === 0) {
      // checking for the first characters in the string
      result += decimal[i]
      // adding the decimal value to our result counter
      str = str.replace(roman[i], '')
      // remove the matched Roman letter from the beginning
    }
  }
  return (result)
}

function removeEndings (word) {
  if (word.slice(-3) === 'ing') {
    return (word.slice(0, -3))
  } else if (word.slice(-2) === 'ed') {
    return (word.slice(0, -2))
  } else if (word.slice(-1) === 's') {
    return (word.slice(0, -1))
  }
  return (word)
}

function distance (seq1, seq2, allowAbrev) {
  // s1 is submitted answer stuff, s2 is given stuff
  if (allowAbrev) {
    if (seq1.substring(0, 1) === seq2 || seq2.substring(0, 1) === seq1) {
      return (1)
    }
  }

  // some short circuit stuff for efficiency
  if (seq1 === seq2) {
    return 1
  }

  if (Math.abs(seq1.length - seq2.length) > 2) {
    return 0
  }

  // check if numbers are the exact same because they normally have to be
  const submittedNumb = !(seq1.match(/\d/g)) ? '' : seq1.match(/\d/g).join('') // extract number
  const correctNumb = !(seq2.match(/\d/g)) ? '' : seq2.match(/\d/g).join('')
  if (submittedNumb !== correctNumb) {
    return (0)
  }

  let len1 = seq1.length
  let len2 = seq2.length
  let i, j
  let dist
  let ic, dc, rc
  let last, old

  const weighter = {
    insert: function (c) { return insertDeleteLetterCalc(c) },
    delete: function (c) { return insertDeleteLetterCalc(c) },
    replace: function (c, d) { return charDist(c, d) }
  }

  if (len1 === 0 || len2 === 0) {
    dist = 0
    while (len1) { dist += weighter.delete(seq1[--len1]) }
    while (len2) { dist += weighter.insert(seq2[--len2]) }
    return dist
  }

  const column = []

  column[0] = 0
  for (j = 1; j <= len2; ++j) { column[j] = column[j - 1] + weighter.insert(seq2[j - 1]) }

  for (i = 1; i <= len1; ++i) {
    last = column[0] /* m[i-1][0] */
    column[0] += weighter.delete(seq1[i - 1]) /* m[i][0] */
    for (j = 1; j <= len2; ++j) {
      old = column[j]
      if (seq1[i - 1] === seq2[j - 1]) {
        column[j] = last /* m[i-1][j-1] */
      } else {
        ic = column[j - 1] + weighter.insert(seq2[j - 1]) /* m[i][j-1] */
        dc = column[j] + weighter.delete(seq1[i - 1]) /* m[i-1][j] */
        rc = last + weighter.replace(seq1[i - 1], seq2[j - 1]) /* m[i-1][j-1] */
        column[j] = ic < dc ? ic : (dc < rc ? dc : rc)
      }
      last = old
    }
  }

  dist = column[len2]

  return (1 - dist / (1.6 * (0.5 + Math.min(seq1.length, seq2.length))))
}

function insertDeleteLetterCalc (char) {
  if (char === ' ') {
    return (1.5)
  } else {
    return (1)
  }
}

const keyboard = {
  1: [-1, 0],
  2: [-1, 1],
  3: [-1, 2],
  4: [-1, 3],
  5: [-1, 4],
  6: [-1, 5],
  7: [-1, 6],
  8: [-1, 7],
  9: [-1, 8],
  0: [-1, 9],
  '-': [-1, 10],
  '+': [-1, 11],
  q: [0, 0],
  w: [0, 1],
  e: [0, 2],
  r: [0, 3],
  t: [0, 4],
  y: [0, 5],
  u: [0, 6],
  i: [0, 7],
  o: [0, 8],
  p: [0, 9],
  '[': [0, 10],
  ']': [0, 11],
  a: [1, 0],
  s: [1, 1],
  d: [1, 2],
  f: [1, 3],
  g: [1, 4],
  h: [1, 5],
  j: [1, 6],
  k: [1, 7],
  l: [1, 8],
  ';': [0, 10],
  "'": [0, 11],
  z: [2, 0],
  x: [2, 1],
  c: [2, 2],
  v: [2, 3],
  b: [2, 4],
  n: [2, 5],
  m: [2, 6],
  ',': [2, 7],
  '.': [2, 8]
}

function charDist (c1, c2) {
  try {
    return (((Math.sqrt(Math.abs(keyboard[c1][0] - keyboard[c2][0]) + Math.abs(keyboard[c1][1] - keyboard[c2][1]))) < 1.5)
      ? 0.4
      : (((Math.sqrt(
        Math.abs(keyboard[c1][0] - keyboard[c2][0]) +
    Math.abs(keyboard[c1][1] - keyboard[c2][1])
      ) < 2) ? 0.75 : 1.5)))
  } catch (err) {
    return (1.5)
  }
}



module.exports = checkCorrect
