const defaultRoomSettings = JSON.stringify(require('./config/defaultroomsettings'))
// const pool = require('./db/pool')
// const { sql } = require('slonik')
// const redis = require('./db/redis')
const questionManager = require('./util/questions')
const checkCorrect = require('../shared/answerChecking')

// The `Game` class is socket-independent... not sure if the bound emit method
// is ideal or we should just return promises with objects from everything
class Game { // Move to this client side eventually
  // TODO: Eventually a lot of this could be moved to redis if we want to scale
  constructor (settings, { fetchRandomTossup, fetchRandomBonus }, emit) {
    this.currentQuestion = null
    this.startTime = null

    this.isPaused = false
    this.isBuzzing = null
    this.promptLevel = 0
    this.buzzList = null
    this.buzzTimeout = null
    this.buzzStartTime = null

    // All the scores and team affiliations are stored here
    this.players = {}

    this.settings = settings

    this.emit = emit

    this.fetchRandomTossup = fetchRandomTossup
    this.fetchRandomBonus = fetchRandomBonus
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
      settings: this.settings
    }
  }

  addPlayer (user) {
    this.emit('userJoin', user)

    if (!Object.prototype.hasOwnProperty.call(this.players, user.id)) {
      this.players[user.id] = Object.assign({}, user, { score: 0, team: null })
    }

    this.emit('updatePlayer',
      {
        player: user.id,
        data: this.players[user.id]
      })

    return this.gameInfo
  }

  chat (player, message) {
    if (this.players[player.id].level <= 0) {
      player.emit('error', 'Permission denied')
      return
    }

    this.emit('chat', { player: player.id, message: message })
  }

  changeSettings (player, newSettings) {
    this.settings = Object.assign({}, this.settings, newSettings)

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

    if (result === 'correct' || result === 'wrong') {
      this.resetQuestion()

      const points = result === 'wrong' ? -5 : (power ? 15 : 10)
      this.players[player.id].score += points

      this.emit('updatePlayer',
        {
          player: player.id,
          data: this.players[player.id]
        })
    } else if (result === 'prompt' /* Handle Prompts Later */) {
      this.resetQuestion()
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

    let newQuestion

    try {
      newQuestion = await this.fetchRandomTossup()
    } catch (err) {
      return // Add in a Guru Meditation Bowl thing later
    }

    this.currentQuestion = newQuestion
    this.emit('nextQuestion', { player: player.id, question: newQuestion })
    this.startTime = Date.now()
  }
}

function createSocketGame (io, name, settings, creator) {
  if (!settings) {
    settings = JSON.parse(defaultRoomSettings)
  }

  if (creator) {
    settings.userlevels[creator] = 2 // Make the creator a moderator
  }

  return new Game(settings, questionManager, (eventName, ...args) => {
    io.to(name).emit(eventName, ...args)
  })
}

module.exports = { Game, createSocketGame }
