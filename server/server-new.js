
const express = require('express')
const http = require('http')
const history = require('connect-history-api-fallback')

const session = require('express-session')
const RedisStore = require('connect-redis')(session);
const sessionStore = new RedisStore({ url: process.env.REDIS_URL })

const querystring = require('querystring')

const app = express()
const server = http.Server(app)

const io = require('socket.io')(server)

const passport = require("./config/passport")
const passportSocketIo = require("passport.socketio")
const flash = require('connect-flash');

const SESSION_SECRET = process.env.SESSION_SECRET || "state college academic tournament!"

const redis = require("./db/redis")
const pool = require("./db/pool")
const { sql } = require("slonik")

app.use(session({
  store: new RedisStore,
  secret: process.env.SESSION_SECRET || "state college academic tournament!",
  key: "express.session",
  resave: false,
  saveUninitialized: true,
  unset: 'destroy'
}))

io.use(passportSocketIo.authorize({
  key: 'express.session',
  secret: SESSION_SECRET,
  store: sessionStore,
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use('/auth', require('./routes/auth'))

// SOCKET.IO
io.on('connection', function (socket) {
  socket.emit('userinfo', socket.request.user)

  socket.on('message', function (message) {
    socket.emit('message', message)
  })
})

app.use(history())

server.listen(process.env.PORT, process.env.IP)