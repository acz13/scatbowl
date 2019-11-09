import { Router } from 'express'

import passport from '../config/passport'

const router = Router()

function authOrRedirect (method, options) {
  return function (req, res, next) {
    passport.authenticate(method, { failureRedirect: '/', successRedirect: '/', ...options }, function (err, user, { redirect, message } = {}) {
      if (err) { return next(err) }

      if (message) {
        req.flash('message', message)
      }

      if (redirect) {
        return res.redirect(redirect)
      }

      req.login(user, function (err) {
        if (err) { return next(err) }

        return res.redirect(options.successRedirect || '/')
        // return res.json({ ...req.user, messages: req.flash('message') })
        // return res.redirect
      })
    })(req, res, next)
  }
}

router.post('/signup', authOrRedirect('local-signup'))
router.post('/login', authOrRedirect('local-login'))

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }))
router.get('/redirect/google', authOrRedirect('google'))

router.get('/guest', authOrRedirect('guest', { failureFlash: true }))

router.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

module.exports = router
