const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const router = express.Router()
const path = require('path')

router.use(cookieParser())
router.use(bodyParser.json())

// --------------------------------------------------------- API: LOGIN/OUT ----
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~

router.post('/api/login', async (req, res) => {
  const adminLogin = req.body.page.includes('login')
  const user = {}

  if (!req.body.page || !req.body.password) {
    return res.json({ error: 'password is required' })
  }

  if (adminLogin) { // admin login, ie '/login/'
    user.password = process.env.ADMIN_PWD_HASH
  } else { // home page login for show
    // TODO !!!!!! lookup user password for this particular show date
    user.password = process.env.USER_TEST_HASH
  }

  const valid = await bcrypt.compare(req.body.password, user.password)
  if (!valid) return res.json({ error: 'password is incorrect' })

  const tokenType = adminLogin ? 'AdminToken' : 'AccessToken'
  const userData = { data: 'for', the: 'token' }
  const token = jwt.sign(userData, process.env.JWT_SECRET)
  const oneDay = 24 * 60 * 60 * 1000
  res.cookie(tokenType, token, {
    maxAge: oneDay,
    // secure: true,
    // sameSite: true,
    httpOnly: true
  }).json({ message: 'access granted' })
})

router.post('/api/admin-logout', (req, res) => {
  res.cookie('AdminToken', '', { expires: new Date() }).json({
    message: 'logout successful'
  })
})

router.post('/api/logout', (req, res) => {
  res.cookie('AccessToken', '', { expires: new Date() }).json({
    message: 'logout successful'
  })
})

// --------------------------------------------------------------- PROTECTED ---
// ------------------------------------------------------------- PAGE ROUTES ---

async function checkForToken (type, req, res) {
  const token = type === 'any'
    ? req.cookies.AdminToken || req.cookies.AccessToken
    : req.cookies[type]
  if (!token) return { error: 'no access token' }

  const valid = await jwt.verify(token, process.env.JWT_SECRET)
  if (!valid) return { error: 'access token is invalid' }

  return { message: 'access granted' }
}

function handleProtectedRoute (o, res, errPath, succesPath) {
  if (o.error) res.redirect(errPath)
  else res.sendFile(path.join(__dirname, succesPath))
}

router.get('/admin', async (req, res) => {
  const o = await checkForToken('AdminToken', req, res)
  handleProtectedRoute(o, res, '/login', '../protected/admin-panel.html')
})

router.get('/show', async (req, res) => {
  const o = await checkForToken('any', req, res)
  handleProtectedRoute(o, res, '/', '../protected/prepared-pop-ups/index.html')
})

router.get('/chat', async (req, res) => {
  const o = await checkForToken('any', req, res)
  handleProtectedRoute(o, res, '/', '../protected/chat.html')
})

module.exports = router
