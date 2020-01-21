import pool from '../db/pool'
import  { sql, UniqueIntegrityConstraintViolationError } from 'slonik'
import LocalStrategy from 'passport-local'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'

export function passportDBs (passport) {
  passport.use('local-login', new LocalStrategy({
    passReqToCallback: true
  },
  async function (req, username, password, cb) {
    try {
      const user = await pool.maybeOne(sql`
        SELECT id, username, password FROM users
        WHERE lower(username) = lower(${username})
      `)

      if (user === null) {
        return cb(null, false, { message: 'No user found.' })
      }

      const match = await bcrypt.compare(passport, user.password)
      if (match) {
        cb(null, user)
      } else {
        cb(null, false, { message: 'Wrong password.' })
      }
    } catch (err) {
      return cb(err)
    }
  }
  ))

  passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
  },
  function (req, username, password, cb) {
    pool.connect(async (connection) => {
      try {
        const email = req.body.email
        const existingUser = await pool.maybeOneFirst(sql`
          SELECT 1 FROM users
          WHERE lower(username) = lower(${username})
          OR lower(email) = lower(${email})
        `)
        if (existingUser) {
          return cb(null, false, { message: 'User already exists with same email or username' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const id = await pool.oneFirst(sql`
          INSERT INTO users (username, email, password)
          VALUES (${username}, ${email}, ${hashedPassword})
          RETURNING id
        `)

        return cb(null, { id: id, username: username })
      } catch (err) {
        if (err instanceof UniqueIntegrityConstraintViolationError) {
          return cb(null, false, { message: 'User already exists with same email or username' })
        } else {
          return cb(err)
        }
      }
    })
  }
  ))

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/redirect/google',
    proxy: true,
    passReqToCallback: true
  },
  async function (req, accessToken, refreshToken, profile, cb) {
    pool.connect(async (connection) => {
      try {
        if (req.isAuthenticated() && !req.user.isGuest) { // User is already logged in, link Google account if we can
          const existingID = await connection.maybeOneFirst(sql`
            SELECT google_id FROM users
            WHERE id = ${req.user.id}
          `)

          if (existingID) {
            return cb(null, false, { message: 'Google account already linked.' })
          } else {
            const user = await connection.one(sql`
              UPDATE users SET google_id = ${profile.id}
              WHERE id = ${req.user.id}
              RETURNING id, username
            `)
            return cb(null, user)
          }
        }

        // User is not yet logged in
        // Try to find existing Google account
        const user = await connection.maybeOne(sql`
          SELECT id, username FROM users
          WHERE google_id = ${profile.id}
        `)

        if (user) { // User found
          // Log out session before logging in again
          return cb(null, user)
        }

        // User not found
        const email = profile.emails[0].value
        const existingID = await connection.maybeOneFirst(sql`
          SELECT id FROM users
          WHERE lower(email) = lower(${email})
        `)

        if (existingID) { // Existing user found
          return cb(null, false, { message: 'Existing user with same email found, please sign in and link accounts' })
        }
      } catch (err) {
        cb(err)
      }
    })
  }
  ))
}