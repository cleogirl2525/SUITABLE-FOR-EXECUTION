const path = require('path')
const express = require('express')
const router = express.Router()
const { checkForToken } = require('./utils.js')
const defaultLogin = process.env.ANALYTICS_LOGIN === 'DEFAULT'
const loginPath = defaultLogin ? '/analytics-login' : process.env.ANALYTICS_LOGIN

if (defaultLogin) {
  router.get('/analytics-login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../html/login.html'))
  })
}

router.get('/analytics', async (req, res) => {
  const o = await checkForToken(req, res)
  if (o.error) res.redirect(loginPath)
  else res.sendFile(path.join(__dirname, '../html/analytics.html'))
})

module.exports = router
