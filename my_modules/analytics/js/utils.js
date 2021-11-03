const jwt = require('jsonwebtoken')

async function checkForToken (req, res) {
  const token = req.cookies[process.env.ANALYTICS_COOKIE]
  if (!token) return { error: 'no access token' }

  const valid = await jwt.verify(token, process.env.ANALYTICS_JWT_SECRET)
  if (!valid) return { error: 'access token is invalid' }

  return { message: 'access granted' }
}

function dateStr (date, one) {
  const yer = date.getFullYear()
  let mon = date.getMonth()
  if (one) mon += 1 // +1 mans Jan === 01 instead of 00
  let day = date.getDate()
  mon = String(mon).length === 1 ? '0' + mon : mon
  day = String(day).length === 1 ? '0' + day : day
  return `${yer}-${mon}-${day}`
}

module.exports = { checkForToken, dateStr }
