import * as Joi from '@hapi/joi'

const userID = Joi.alternatives().try(
  Joi.number().positive(),
  Joi.string().regex(/^guest[a-z0-9]{8,30}$/)
)

// USERLEVELS
// -1: banned (UNUSED)
// 0: guests
// 1: regular players
// 2: moderators
// 3: UNUSED
// 4: UNUSED
// 5: site admins (default rooms only)
const level = Joi.number().integer().max(5).min(-1)

const userLevel = Joi.object({
  level: level.required(),
  dateChanged: Joi.date().default(Date.now, 'time of level change')
})

const userLevels = Joi.object().pattern(
  userID,
  userLevel
)

const searchFilters = Joi.object({
  difficulty: Joi.array().items(Joi.string()), // [] is all difficulties
  category: Joi.array().items(Joi.number().integer()), // [] is all categories
  subcategory: Joi.array().items(Joi.number().integer()) // [] is all subcategories
})

const settings = Joi.object({
  gameMode: Joi.string().valid('infinite').default('infinite'), // Only one game mode for now

  defaultCreatorLevel: level.default(2),

  allowResetAllAccessLevel: level.default(Joi.ref('defaultCreatorLevel')),
  allowNextAccessLevel: level.default(0),
  allowSkipAccessLevel: level.default(Joi.ref('defaultCreatorLevel')),
  allowPauseAccessLevel: level.default(Joi.ref('defaultCreatorLevel')),
  allowSettingsAccessLevel: level.default(Joi.ref('defaultCreatorLevel')),

  allowMultipleBuzzes: Joi.boolean().default(false),

  onlyAllowTeams: Joi.boolean().default(false),

  manualAnswerCheckingEnabled: Joi.boolean().default(false),
  manualAnswerCheckingLevel: level.default(Joi.ref('defaultCreatorLevel')),
  maxPromptLevel: Joi.number().positive().allow(null).default(null), // number of times someone can be prompted before neg; null = no limit

  wordDelay: Joi.number().min(0).max(500).default(150), // in milliseconds

  searchQuery: Joi.string().allow('').default(''),

  searchFilters: searchFilters

  // TODO: category weighting
})

module.exports = {
  userLevel,
  userLevels,
  searchFilters,
  settings
}
