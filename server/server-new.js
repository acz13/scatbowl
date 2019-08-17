
const express = require('express')
const http = require('http')
const history = require('connect-history-api-fallback')

const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const sessionStore = new RedisStore({ url: process.env.REDIS_URL })

const app = express()
const server = http.Server(app)

const io = require('socket.io')(server)
const game = require('./game')

const passport = require('./config/passport')
const passportSocketIo = require('passport.socketio')
const flash = require('connect-flash')

const SESSION_SECRET = process.env.SESSION_SECRET || 'state college academic tournament!'

app.use(session({
  store: new RedisStore(),
  secret: process.env.SESSION_SECRET || 'state college academic tournament!',
  key: 'express.session',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy'
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', require('./routes/auth'))

const path = require('path')
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.use(history())

const gameRooms = {}

// SOCKET.IO
io.use(passportSocketIo.authorize({
  key: 'express.session',
  secret: SESSION_SECRET,
  store: sessionStore
}))

io.on('connection', function (socket) {
  socket.emit('login', socket.request.user)
  const id = socket.request.user.id

  const player = {
    id: id,
    emit: (eventName, ...args) => {
      socket.emit(eventName, ...args)
    }
  }

  if (socket.handshake.query.room) {
    const room = socket.handshake.query.room

    if (!Object.prototype.hasOwnProperty.call(gameRooms, room)) {
      // TODO: get from db
      gameRooms[room] = game.createSocketGame(io, room, null, id)
    }

    socket.emit('gameInfo', gameRooms[room].addPlayer(socket.request.user))
    socket.gameRoom = gameRooms[room]
    socket.join(room)
  }

  socket.on('getGameInfo', () => {
    socket.emit('gameInfo', socket.gameRoom.gameInfo)
  })

  socket.on('chat', message => {
    socket.gameRoom.emit('chat', { user: id, message: message })
  })

  socket.on('changeSettings', newSettings => {
    socket.gameRoom.changeSettings(player, newSettings)
  })

  socket.on('buzz', time => {
    socket.gameRoom.buzz(player, time)
  })

  socket.on('submitAnswer', answer => {
    socket.gameRoom.submitAnswer(player, answer)
  })

  socket.on('skipQuestion', () => {
    socket.gameRoom.skipQuestion(player)
  })

  socket.on('nextQuestion', () => {
    socket.gameRoom.nextQuestion(player)
  })
})

server.listen(process.env.PORT, process.env.IP)
