require('dotenv').config()

const path = require('path')
const log = require('./js/analytics.js')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const setup = (app, opts) => {
  if (opts.track) {
    if (opts.track.post) {
      app.use(cookieParser())
      app.use(bodyParser.json())
      process.env.ANALYTICS_POST_DATA = opts.track.post
    }
    if (opts.track.include) {
      process.env.ANALYTICS_INCLUDE = opts.track.include
    } else if (opts.track.exclude) {
      process.env.ANALYTICS_EXCLUDE = opts.track.exclude
    }
  }

  if (opts.path) {
    process.env.ANALYTICS_DATA_PATH = opts.path
  } else if (!process.env.ANALYTICS_DATA_PATH) {
    process.env.ANALYTICS_DATA_PATH = path.join(__dirname, 'data')
  }

  app.use(log)

  if (opts.auth) {
    process.env.ANALYTICS_JWT_SECRET = opts.auth.secret || '12345ABCDE'
    process.env.ANALYTICS_COOKIE = opts.auth.cookie || 'ANALYTICS_COOKIE'
    process.env.ANALYTICS_LOGIN = opts.auth.login || 'DEFAULT'

    if (opts.auth.api) {
      const api = require('./js/rest-api.js')
      app.use(api)
    }

    if (opts.auth.gui) {
      const gui = require('./js/gui-router.js')
      app.use(gui)
    }
  }

  if (opts.bots) {
    process.env.ANALYTICS_BOT_CATCHER = true
    if (opts.bots.ip) { process.env.ANALYTICS_SERVER_IP = opts.bots.ip }
    process.env.ANALYTICS_BOTS_PATH = opts.bots.path
      ? opts.bots.path : path.join(__dirname, 'bots')
    const bot = require('./js/bot-bait-router.js')
    app.use(bot)
  }
}

module.exports = { log, setup }
