// TODO

const fetch = require('node-fetch')

var category, subcategory, tournament, difficulty

async function loadSearchFiltersFromQuizDB () {
  const response = await fetch('https://www.quizdb.org/api/filter_options')
  ;({ category, subcategory, tournament, difficulty } = await response.json())
}

async function loadSearchFiltersFromDB () {

}

module.exports = {
  category,
  subcategory,
  tournament,
  difficulty,

  loadSearchFiltersFromDB,
  loadSearchFiltersFromQuizDB
}
