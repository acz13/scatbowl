module.exports = Object.freeze({
  // USERLEVELS
  // -1: banned (UNUSED)
  // 0: guests
  // 1: regular players
  // 2: moderators
  // 3: UNUSED
  // 4: UNUSED
  // 5: site admins (default rooms only)
  userlevels: {
    // userid: level
  },

  settings: {
    gameMode: 'infinite', // currently unused, may implement set matches in the future

    allowResetAllAccessLevel: 2,
    allowNextAccessLevel: 0,
    allowSkipAccessLevel: 2,
    allowPauseAccessLevel: 2,
    allowSettingsAccessLevel: 2,

    allowMultipleBuzzes: false,

    onlyAllowTeams: false,

    manualAnswerCheckingEnabled: false,
    manualAnswerCheckingLevel: 2,
    maxPromptLevel: null, // number of times someone can be prompted before neg; null = no lomit

    textDelay: 150, // in milliseconds

    searchQuery: '',
    difficulty: ['regular_high_school', 'hard_high_school', 'national_high_school'], // [] is all difficulties
    category: [], // [] is all categories
    subcategory: [] // [] is all subcategories

    // TODO: category weighting
  }
})
