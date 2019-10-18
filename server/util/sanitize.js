// Blatantly ripped off from Raynor Kuang's source code
// See https://github.com/UlyssesInvictus/QuizDB

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

import sanitizeHtml from 'sanitize-html'

export function cleanSpecial (str) {
  let newStr = str.replace(/Â/g, '')
  newStr = newStr.replace(/&quot;/g, '')
  newStr = newStr.replace(/猴/g, 'f')
  newStr = newStr.replace(/睌/g, 'f')
  newStr = newStr.replace(/猼/g, 'f')
  newStr = newStr.replace(/✴/g, 'fi')
  newStr = newStr.replace(/⢄/g, 'ft')
  newStr = newStr.replace(/Ã¶/g, 'ö')
  newStr = newStr.replace(/Ã©/g, 'é')
  newStr = newStr.replace(/送/g, 'fi')
  newStr = newStr.replace(/畔/g, 'f')
  newStr = newStr.replace(/㱀/g, 'f')
  newStr = newStr.replace(/Ã¼/g, 'ü')
  newStr = newStr.replace(/Ã±/g, 'ñ')
  newStr = newStr.replace(/㻈/g, 'f')
  newStr = newStr.replace(/Ã¨/g, 'è')
  newStr = newStr.replace(/Ã¸/g, 'ü')
  newStr = newStr.replace(/ぺ/g, 'ft')
  return newStr
}

export function cleanString (str) {
  let newStr = cleanSpecial(str)
  newStr = sanitizeHtml(newStr, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u']
  })
  return newStr
}

function escapeRegexSpecial (str) {
  // eslint-disable-next-line
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function formatQuestionString (str, query = null) {
  let newStr = cleanString(str)
  if (query) {
    newStr = newStr.replace(new RegExp(escapeRegexSpecial(query), 'gi'), `<mark class='question-highlight'>$&</mark>`)
  }
  return newStr
}

export function extractTossupText (tossup) {
  return cleanSpecial(tossup.text) + ' \n\n' + cleanSpecial(tossup.answer) + '\n\n'
}

export function extractBonusText (bonus) {
  let content = cleanSpecial(bonus.leadin) + ' \n\n';
  [0, 1, 2].forEach(index => {
    content += ' \n\n'
    content += cleanSpecial(bonus.texts[index])
    content += ' \n\n'
    content += cleanSpecial(bonus.answers[index])
    content += ' \n\n'
  })
  return content
}

export function extractActualAnswer (answer) {
  const regMatch = answer.match(/<b>.*<\/b>/) || answer.match(/<strong>.*<\/strong>/)
  return regMatch ? regMatch[0] : null
}

export function generateWikiLink (question, index = null) {
  const wikiPrefix = 'https://en.wikipedia.org/w/index.php?search='
  let url, answer, formattedAnswer
  if (question.type === 'tossup') {
    url = question.wikipedia_url
    answer = question.answer
    formattedAnswer = question.formatted_answer
  } else {
    url = question.wikipedia_urls[index]
    answer = question.answers[index]
    formattedAnswer = question.formatted_answers[index]
  }

  if (isPresent(url)) {
    return url
  } else if (extractActualAnswer(formattedAnswer)) {
    const actualAnswer = sanitizeHtml(extractActualAnswer(formattedAnswer), { allowedTags: [] })
    return `${wikiPrefix}${encodeURI(actualAnswer)}`
  } else {
    return `${wikiPrefix}${encodeURI(answer)}`
  }
}

export function handleEmpty (string, showForEmpty = 'None') {
  return ((string && string.trim !== '') ? string : showForEmpty)
}

export function isPresent (string) {
  return string && string.trim !== ''
}
