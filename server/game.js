const schemas = require('./config/schemas')
// const pool = require('./db/pool')
// const { sql } = require('slonik')
// const redis = require('./db/redis')
const quizDBQuestionManager = require('./util/quizDBQuestions')
const dbQuestionManager = require('./util/dbQuestions')
const checkCorrect = require('../shared/answerChecking')

// The `Game` class is socket-independent... not sure if the bound emit method
// is ideal or we should just return promises with objects from everything
class Game { // Move to this client side eventually
  // TODO: Eventually a lot of this could be moved to redis if we want to scale
  constructor (
    settings,
    userLevels,
    questionManager,
    emit
  ) {
    this.currentQuestion = null
    this.questionQueue = null
    this.startTime = null

    this.isPaused = false
    this.isBuzzing = null
    this.promptLevel = 0
    this.buzzList = null
    this.buzzTimeout = null
    this.buzzStartTime = null

    // All the scores and team affiliations are stored here
    this.players = {}
    this.socketIDs = {}

    this.userLevels = userLevels

    this.settings = settings

    this.emit = emit

    this.questionManager = questionManager
  }

  resetQuestion () {
    clearTimeout(this.buzzTimeout)

    this.currentQuestion = null
    this.startTime = null
    this.isBuzzing = null
    this.promptLevel = 0
    this.buzzList = null
    this.buzzTimeout = null
    this.buzzStartTime = null
  }

  get gameInfo () {
    return {
      currentQuestion: this.currentQuestion,
      startTime: this.startTime,
      isPaused: this.isPaused,
      isBuzzing: this.isBuzzing,
      promptLevel: this.promptLevel,
      buzzStartTime: this.buzzStartTime,
      players: this.players,
      settings: this.settings,
      userLevels: this.userLevels
    }
  }

  addPlayer (user, socketID) {
    if (!Object.prototype.hasOwnProperty.call(this.players, user.id)) {
      this.players[user.id] = Object.assign({}, user, { team: null, powers: 0, gets: 0, negs: 0, status: 2 })
    }

    if (!Object.prototype.hasOwnProperty.call(this.socketIDs, user.id)) {
      this.socketIDs[user.id] = new Set()
    }

    this.socketIDs[user.id].add(socketID)

    if (this.socketIDs[user.id].size > 1) {
      return this.gameInfo
    }

    this.emit('userJoin', user)

    this.emit('updatePlayer',
      {
        player: user.id,
        data: this.players[user.id]
      })

    return this.gameInfo
  }

  leave (userid, socketID) {
    this.socketIDs[userid].delete(socketID)

    if (this.socketIDs[userid].size == 0) {
      this.players[userid].status = 0

      this.emit('updatePlayer',
        {
          player: userid,
          data: this.players[userid]
        })
    }
  }

  chat (player, message) {
    if (this.players[player.id].level <= 0) {
      player.emit('gameError', 'Permission denied')
      return
    }

    this.emit('chat', { player: player.id, message: message })
  }

  changeSettings (player, newSettings) {
    // Validate new settings and determine if we need to clear the queue
    const { error, value: settings } = schemas.settings.validate(Object.assign({}, this.settings, newSettings))

    if (error) {
      player.emit('gameError', `Bad settings ${error}`)
      return
    }

    this.questionQueue = null
    this.settings = settings

    this.emit('changeSettings', { player: player.id, newSettings: this.settings })
  }

  buzz (player, time) {
    if (!this.currentQuestion || this.isPaused || this.isBuzzing) {
      player.emit('gameError', "Can't buzz now")
      return
    }

    if (this.settings.onlyAllowTeams && !this.players[player.id].team) {
      player.emit('gameError', 'Permission denied')
      return
    }

    if (Math.abs(time - Date().now + this.startTime) > 0.2) {
      player.emit('gameError', 'Too far out of sync, try reloading?')
      return
    }

    if (this.buzzList) {
      this.buzzList.push({ player: player.id, timeSince: time })
    } else {
      this.buzzList = [{ player: player.id, timeSince: time }]
      this.buzzTimeout = setTimeout(() => {
        // TODO: decide who should win the buzzer race with pings and delays eventually
        this.buzzList.sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)
        const winner = this.buzzList[0]
        this.emit('buzz', { winner: winner, losers: this.buzzList.slice(1) })
        this.isBuzzing = winner.player
        this.buzzList = null
      }, 50)
    }
  }

  submitAnswer (player, answer) {
    if (player.id !== this.isBuzzing) {
      return
    }

    // const displayedText (Should we calculate this server side?)
    const displayedText = ''
    const power = false
    const result = checkCorrect(answer, this.currentQuestion.answer, displayedText, this.currentQuestion.text /*, this.currentQuestion.category */)

    this.emit('answer', { answer: answer, result: result })

    if (result === 'correct') {
      this.resetQuestion()

      if (power) {
        this.players[player.id].powers++
      } else {
        this.players[player.id].gets++
      }

      this.emit('updatePlayer',
        {
          player: player.id,
          data: this.players[player.id]
        })
    } else if (result === 'wrong') {
      this.players[player.id].negs++

      this.emit('updatePlayer',
        {
          player: player.id,
          data: this.players[player.id]
        })
    } else if (result === 'prompt' /* Handle Prompts Later */) {
      this.promptLevel++
      this.emit('prompt', { answer: answer, promptLevel: this.promptLevel })
    }
  }

  skipQuestion (player) {
    if (this.isBuzzing) { // Ignore
      return
    }

    if (this.players[player.id].level < this.settings.allowSkipAccessLevel) {
      player.emit('gameError', 'Permission denied')
      return
    }

    this.resetQuestion()

    this.emit('skipQuestion', { player: player.id })

    return this.nextQuestion(player)
  }

  async nextQuestion (player) {
    if (this.currentQuestion) {
      return
    }

    if (this.players[player.id].level < this.settings.allowNextAccessLevel) {
      player.emit('gameError', 'Permission denied')
      return
    }

    this.resetQuestion()

    if (!this.questionQueue || this.questionQueue.length === 0) {
      try {
        this.questionQueue = await this.questionManager.fetchRandomTossups({
          searchQuery: this.settings.searchQuery,
          searchFilters: {
            difficulty: this.settings.difficulty,
            subcategory: this.settings.subcategory,
            category: this.settings.category
          }
        })
        console.log('Fetched ' + this.questionQueue.length + ' questions')
      } catch (err) {
        player.emit('gameError', err.toString())
        return // Add in a Guru Meditation Bowl thing later
      }
    }

    this.currentQuestion = this.questionQueue.pop()
    this.emit('nextQuestion', { player: player.id, question: this.currentQuestion })
    this.startTime = Date.now()
  }
}

function createSocketGame (io, name, settings, userLevels, creator) {
  const { error: settingsError, value: fullSettings } = schemas.settings.validate(settings)

  if (settingsError) {
    throw settingsError
  }

  if (creator) {
    userLevels[creator] = { level: fullSettings.defaultCreatorLevel }
  }

  const { error: userLevelsError, value: fullUserLevels } = schemas.userLevels.validate(userLevels)

  if (userLevelsError) {
    throw userLevelsError
  }

  return new Game(fullSettings, fullUserLevels, quizDBQuestionManager, (eventName, ...args) => {
    io.to(name).emit(eventName, ...args)
  })
}

module.exports = { Game, createSocketGame }
