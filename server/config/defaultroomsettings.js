module.exports = Object.freeze({
  gameMode: 'infinite', // currently unused, may implement set matches in the future

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

  allowNextAccessLevel: 0,
  allowSkipAccessLevel: 2,
  allowPauseAccessLevel: 2,
  allowSettingsAccessLevel: 2,

  onlyAllowTeams: false,

  manualAnswerCheckingEnabled: false,
  manualAnswerCheckingLevel: 2,
  maxPromptLevel: null, // number of times someone can be prompted before neg; null = no lomit

  textDelay: 150, // in milliseconds
  difficulties: [3, 4, 5], // [] is all difficulties
  categories: [], // [] is all categories
  subcategories: [] // [] is all subcategories

  // TODO: category weighting
})
