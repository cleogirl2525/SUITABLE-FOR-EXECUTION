const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const router = express.Router()
const path = require('path')
const fs = require('fs')

router.use(cookieParser())
router.use(bodyParser.json())

// --------------------------------------------------------- API: PASSWOLRDS ---
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~

// async function pw2hash (pw) {
//   const salt = await bcrypt.genSalt(10)
//   const hashPw = await bcrypt.hash(pw, salt)
//   return hashPw
// }

async function add2pwLogs (req, type) {
  let pw = null
  if (req.body && req.body.password) {
    pw = req.body.password
  } else if (req.cookies.AccessToken) {
    const valid = await jwt.verify(req.cookies.AccessToken, process.env.JWT_SECRET)
    pw = valid.data
  }

  if (!pw && req.cookies.AdminToken) return
  else if (!pw) return console.log('add2pwLogs could not find password')

  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  ip = ip.includes('ffff:') ? ip.split('ffff:')[1] : ip
  const fp = path.join(__dirname, '../data/pw/audience-pwds.json')
  const data = fs.readFileSync(fp, 'utf8')
  const pwds = JSON.parse(data)
  pwds[pw].push({ type: type, ip: ip, timestamp: Date.now() })
  fs.writeFile(fp, JSON.stringify(pwds), (err) => {
    if (err) console.log(err)
  })
}

router.post('/api/new-audience-pw', async (req, res) => {
  const o = await checkForToken('AdminToken', req, res)
  if (o.error) return res.json(o)

  let pw = req.body.password
  if (!pw) {
    const length = 28
    const list = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
    pw = Array.from(crypto.randomFillSync(new Uint32Array(length)))
      .map((x) => list[x % list.length])
      .join('')
  }

  const fp = path.join(__dirname, '../data/pw/audience-pwds.json')
  try { fs.statSync(fp) } catch (err) { fs.writeFileSync(fp, '{}') }
  const data = fs.readFileSync(fp, 'utf8')
  const pwds = JSON.parse(data)
  if (typeof pwds[pw] !== 'undefined') {
    return res.json({ error: 'password already exists' })
  }
  pwds[pw] = []
  fs.writeFile(fp, JSON.stringify(pwds), (err) => {
    if (err) res.json({ error: 'error saving password to database' })
    else res.json({ message: 'new password added to database' })
  })
})

router.get('/api/pw-list', async (req, res) => {
  const o = await checkForToken('AdminToken', req, res)
  if (o.error) return res.json(o)

  const fp = path.join(__dirname, '../data/pw/audience-pwds.json')
  try { fs.statSync(fp) } catch (err) { fs.writeFileSync(fp, '{}') }
  const data = fs.readFileSync(fp, 'utf8')
  const pwds = JSON.parse(data)
  res.json(pwds)
})

router.post('/api/delete-pw', async (req, res) => {
  const o = await checkForToken('AdminToken', req, res)
  if (o.error) return res.json(o)

  const pw = req.body.password
  const fp = path.join(__dirname, '../data/pw/audience-pwds.json')
  const data = fs.readFileSync(fp, 'utf8')
  const pwds = JSON.parse(data)
  if (typeof pwds[pw] !== 'undefined') {
    delete pwds[pw]
    fs.writeFile(fp, JSON.stringify(pwds), (err) => {
      if (err) res.json({ error: 'error deleting password from database' })
      else res.json({ message: 'password was deleted successfully' })
    })
  } else {
    res.json({ error: 'password does not exist' })
  }
})

// --------------------------------------------------------- API: LOGIN/OUT ----
// ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~ . ~
router.post('/api/login', async (req, res) => {
  const adminLogin = req.body.page.includes('login')
  let valid = false

  if (!req.body.page || !req.body.password) {
    return res.json({ error: 'missing login data' })
  }

  if (adminLogin) { // admin login, ie '/login/'
    const adminHash = process.env.ADMIN_PWD_HASH
    valid = await bcrypt.compare(req.body.password, adminHash)
  } else { // home page login for show
    const fp = path.join(__dirname, '../data/pw/audience-pwds.json')
    const data = fs.readFileSync(fp, 'utf8')
    const pwds = JSON.parse(data)
    const list = Object.keys(pwds)
    if (list.includes(req.body.password)) {
      valid = true
      add2pwLogs(req, 'login')
    }
  }

  if (!valid) return res.json({ error: 'password is incorrect' })

  const tokenType = adminLogin ? 'AdminToken' : 'AccessToken'
  const userData = { data: req.body.password }
  const token = jwt.sign(userData, process.env.JWT_SECRET)
  const oneDay = 24 * 60 * 60 * 1000
  res.cookie(tokenType, token, {
    maxAge: oneDay,
    secure: true,
    sameSite: true,
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

router.get('/pw', async (req, res) => {
  const o = await checkForToken('AdminToken', req, res)
  handleProtectedRoute(o, res, '/login', '../protected/pw.html')
})

router.get('/show', async (req, res) => {
  const o = await checkForToken('any', req, res)
  add2pwLogs(req, 'show')
  handleProtectedRoute(o, res, '/', '../protected/prepared-pop-ups/index.html')
})

router.get('/chat', async (req, res) => {
  const o = await checkForToken('any', req, res)
  handleProtectedRoute(o, res, '/', '../protected/chat.html')
})

// prepared-pop-ups files
const prepPopRoot = '../protected/prepared-pop-ups'
const prepPopFiles = fs.readdirSync(path.join(__dirname, prepPopRoot))

function servePrepPopFile (path) {
  router.get(`/${path}`, async (req, res) => {
    const o = await checkForToken('any', req, res)
    handleProtectedRoute(o, res, '/', `${prepPopRoot}/${path}`)
  })
}

prepPopFiles.forEach(str => {
  if (str.includes('.')) {
    servePrepPopFile(str)
  } else {
    const sub = fs.readdirSync(path.join(__dirname, `${prepPopRoot}/${str}`))
    sub.forEach(s => servePrepPopFile(`${str}/${s}`))
  }
})

module.exports = router
