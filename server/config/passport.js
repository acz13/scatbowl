const passport = require("passport")
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const CustomStrategy = require('passport-custom')

const redis = require("../db/redis")
const pool = require("../db/pool")
const { sql } = require("slonik")

const randomGuestID = require("../util/randomGuestID")

passport.serializeUser(async (user, cb) => {
  cb(null, { id: user.id, username: user.username, isGuest: !!user.isGuest })
})

passport.deserializeUser(async (obj, cb) => {
  cb(null, obj)
})

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/auth/redirect/google',
  proxy: true,
  passReqToCallback: true
},
  async function (req, accessToken, refreshToken, profile, cb) {
    pool.connect(async (connection) => {
      try {
        let user = await connection.maybeOne(sql`SELECT id, username FROM users WHERE google_id = ${profile.id}`)

        if (user) {
          cb(null, user)
        } else {
          let email = profile.emails[0].value
          existingId = await connection.maybeOneFirst(sql`SELECT id FROM users WHERE lower(email) = lower(${email})`)

          console.log(existingId)
          if (existingId) {
            user = await connection.one(sql`UPDATE users SET google_id = ${profile.id} WHERE id = ${existingId} RETURNING id, username`)
            cb(null, user)
          }
        }
      } catch (err) {
        cb(err)
      }
    })
  }
))

passport.use('guest', new CustomStrategy(
  async function (req, cb) {
    try {
      let id = await randomGuestID(4)
      while (await redis.sismemberAsync("guest_names", id)) {
        id = await randomGuestID(4)
      }

      await redis.saddAsync("guest_names", id)

      cb(null, { id: id, username: "guest" + id, isGuest: true });
    } catch (err) {
      cb(err)
    }
  }
))

module.exports = passport