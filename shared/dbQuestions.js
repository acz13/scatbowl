function makeid (length) {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// eventually this will be replaced with a function to search for the question
export function fetchRandomTossups () {
  return new Promise((resolve, reject) => {
    const genText = "This work argues that raises in average wages have led luxury goods to be considered costumer “needs” in what is called the “dependence effect,” and it uses the term “social balance” to refer to the proper relationship between private and public spending. It advocates an increase in public spending in education to help foster a “new class” of workers who enjoy their jobs. Originally titled “Why the Poor are Poor,” this work forms a trilogy with its author's other books American Capitalism and The New Industrial State and introduces the term “conventional wisdom.” For 10 points, name this book reevaluating the American economy, by John Galbraith."
    const genAnswer = 'Epstein-Barr virus or EBV [accept human herpesvirus-4]'
    const genCategory = 22
    const genSubcategory = null

    setTimeout(() => resolve([{
      type: 'tossup',
      text: genText,
      formatted_text: genText,
      answer: genAnswer,
      category: { name: genCategory },
      subcategory: { name: genSubcategory },
      order_id: makeid(4)
    }]), 250)
  })
}

export function fetchRandomBonuses () {
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
      category: { name: genCategory },
      subcategory: { name: genSubcategory }
    }]), 250)
  })
}
