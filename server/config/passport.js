import passport from 'passport'
import CustomStrategy from 'passport-custom'
import * as bcrypt from 'bcrypt'

import redis from '../db/redis'

import randomGuestID from '../util/randomGuestID'
import { getColor } from 'sb-shared/colors'

  
passport.serializeUser(async (user, cb) => {
  console.log('serialize', user)
  await redis.hmsetAsync(`users:${user.id}`, { id: user.id, username: user.username, isGuest: !!user.isGuest, color: user.color || 'red' })
  cb(null, user.id)
})

passport.deserializeUser(async (id, cb) => {
  const result = await redis.hgetallAsync(`users:${id}`)
  console.log('deserialize', id, result)

  cb(null, result)
})

passport.use('guest', new CustomStrategy(
  async function (req, cb) {
    try {
      let id = await randomGuestID(4)
      while (await redis.sismemberAsync('guest_names', id)) { // Loop until unused guest name is found
        id = await randomGuestID(4)
      }

      await redis.saddAsync('guest_names', id)

      const name = 'guest' + id
      cb(null, { id: name, username: name, isGuest: true, color: getColor(name) })
    } catch (err) {
      cb(err)
    }
  }
))

if (process.env.NODE_ENV !== 'test') {
  require('./passportDBs').passportDBs(passport)
}

module.exports = passport
