const express = require('express')
const router = express.Router()
const passport = require('passport')

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy