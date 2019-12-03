import 'dotenv/config'

import express from 'express'
import http from 'http'
import history from 'connect-history-api-fallback'
import session from 'express-session'
import RedisStoreFactory from 'connect-redis'

import ioFactory from 'socket.io'
import game from './game'
import passport from './config/passport'
import passportSocketIo from 'passport.socketio'
import flash from 'connect-flash'
import cors from 'cors'

import proxy from 'http-proxy-middleware'

// import path from 'path'

const RedisStore = RedisStoreFactory(session)
const sessionStore = new RedisStore({ url: process.env.REDIS_URL })

const app = express()
const server = http.Server(app)
app.use(cors())

const SESSION_SECRET = process.env.SESSION_SECRET || 'state college academic tournament!'

app.use(session({
  store: new RedisStore(),
  secret: process.env.SESSION_SECRET || 'state college academic tournament!',
  key: 'sb.session',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy'
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use('/api', proxy('https://www.quizdb.org/api', { changeOrigin: true }))
app.use('/auth', require('./routes/auth'))
app.use('/', proxy('http://localhost:8080', { changeOrigin: true }))
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/index.html'))
// })

app.use(history())

const gameRooms = {}

function joinRoom (socket, room) {
  if (socket.roomName) {
    socket.gameRoom.leave(socket.userID)
    socket.leave(socket.roomName)
  }

  if (!Object.prototype.hasOwnProperty.call(gameRooms, room)) {
    // TODO: get from db
    gameRooms[room] = game.createSocketGame(io, room, {}, {}, socket.userID)
  }

  console.log(`${socket.id} connected corresponding to user ${JSON.stringify(socket.request.user)}`)
  socket.emit('gameInfo', gameRooms[room].addPlayer(socket.request.user, socket.id))
  socket.gameRoom = gameRooms[room]
  console.log(socket.request.user.id + ' joined ' + room)
  socket.join(room)
}

const io = ioFactory(server)

// SOCKET.IO
io.use(passportSocketIo.authorize({
  key: 'sb.session',
  secret: SESSION_SECRET,
  store: sessionStore
}))

io.on('connection', function (socket) {
  socket.emit('login', socket.request.user)
  socket.userID = socket.request.user.id

  const player = {
    id: socket.userID,
    emit: (eventName, ...args) => {
      socket.emit(eventName, ...args)
    }
  }

  if (socket.handshake.query.room) {
    joinRoom(socket, socket.handshake.query.room)

    socket.roomName = socket.handshake.query.room
  }

  socket.on('getGameInfo', () => {
    socket.emit('gameInfo', socket.gameRoom.gameInfo)
  })

  socket.on('chat', message => {
    socket.gameRoom.chat(player, message)
  })

  socket.on('changeSettings', ({ newSettings, rootKey }) => {
    socket.gameRoom.changeSettings(player, newSettings, rootKey)
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

  socket.on('disconnect', () => {
    socket.gameRoom.leave(socket.userID)
  })

  socket.on('leave', () => {
    socket.gameRoom.leave(socket.userID)
  })

  socket.on('timeSync', (clientTime, cb) => {
    cb({ client: clientTime, server: Date.now() })
  })
})

server.listen(process.env.PORT, process.env.IP)
