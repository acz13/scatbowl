
const express = require('express')
const session = require('express-session')
const RedisStore = require('connect-redis')(session);
const sessionStore = new RedisStore({ url: process.env.REDIS_URL })
const http = require('http')

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

// ROUTES
app.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.json(req.user)
  } else {
    res.status(404).send("Not found")
  }
})

// AUTH ROUTES (separate into another file)
app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'], failureFlash: true }))
app.get('/auth/guest', passport.authenticate('guest', { failureFlash: true }), function(req, res) {
  res.redirect('/')
})

app.get('/auth/redirect/google',
  passport.authenticate('google', { failureRedirect: '/', failureFlash: true }),
  function (req, res) {
    res.redirect('/')
  }
)

app.get('/auth/logout', function(req, res) {
  req.logout()
  res.redirect('/')
})

server.listen(process.env.PORT, process.env.IP)