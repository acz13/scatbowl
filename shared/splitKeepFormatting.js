import * as htmlparser2 from 'htmlparser2'

const allowedTags = ['b', 'i', 'em', 'strong', 'u']

export default function splitKeepFormatting (html) {
  const activeTags = {}
  const wordArray = []

  const parser = new htmlparser2.Parser(
    {
      onopentag (tagname) {
        if (allowedTags.includes(tagname)) {
          activeTags[tagname] = true
        }
      },
      ontext (text) {
        wordArray.push(...text.split(/\s/g).map(word => ({ text: word, classes: Object.assign({}, activeTags) })))
      },
      onclosetag (tagname) {
        if (allowedTags.includes(tagname)) {
          activeTags[tagname] = false
        }
      }
    },
    { decodeEntities: true }
  )

  parser.write(html)
  parser.end()

  return wordArray
}
