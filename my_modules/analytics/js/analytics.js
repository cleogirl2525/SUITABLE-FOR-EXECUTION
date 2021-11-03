const device = require('device')
const fs = require('fs')
const exec = require('child_process').exec
const { dateStr } = require('./utils.js')

function addToAnalytics (data, filepath) {
  const logs = require(filepath)
  logs.push(data)
  fs.writeFile(filepath, JSON.stringify(logs), (err) => {
    if (err) console.log(err)
  })
}

function logData (data) {
  const date = dateStr(new Date(), true)
  const dirp = process.env.ANALYTICS_DATA_PATH
  const filepath = `${dirp}/${date}.json`
  fs.stat(filepath, (err, stat) => {
    if (err === null) addToAnalytics(data, filepath)
    else if (err.code === 'ENOENT') {
      fs.writeFile(filepath, '[]', (err) => {
        if (err) return console.log('ANALYTICS ERROR:', err)
        else addToAnalytics(data, filepath)
      })
    } else console.log('ANALYTICS ERROR:', err)
  })
}

function addIP2BotList (ip, list) {
  ip = ip.includes('ffff:') ? ip.split('ffff:')[1] : ip
  const filepath = process.env.ANALYTICS_BOTS_PATH + '/suspected.json'
  fs.readFile(filepath, 'utf8', (err, s) => {
    if (err) return console.log(err)
    const data = JSON.parse(s)
    if (!data[list].includes(ip)) {
      data[list].push(ip)
      fs.writeFile(filepath, JSON.stringify(data), (err) => {
        if (err) return console.log(err)
      })
    }
  })
}

function skipTracking (url) {
  const inc = process.env.ANALYTICS_INCLUDE
  const a = inc
    ? process.env.ANALYTICS_INCLUDE.split(',').map(i => i.trim())
    : process.env.ANALYTICS_EXCLUDE.split(',').map(i => i.trim())

  let matches = 0
  for (let i = 0; i < a.length; i++) {
    const regex = new RegExp('^' + a[i].replace(/\*/g, '.*') + '$')
    if (inc) {
      if (!regex.test(url)) matches++
    } else {
      if (regex.test(url)) matches++
    }
  }

  if (inc) {
    return matches === a.length
  } else {
    return matches > 0
  }
}

function getPostData (b) {
  const p = {}
  process.env.ANALYTICS_POST_DATA
    .split(',')
    .map(i => i.trim())
    .forEach(key => { if (b[key]) { p[key] = b[key] } })
  return p
}

module.exports = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (process.env.ANALYTICS_BOT_CATCHER) {
    if (req.originalUrl === '/bot-bait') addIP2BotList(ip, 'took-the-bait')
    if (process.env.ANALYTICS_SERVER_IP &&
      process.env.ANALYTICS_SERVER_IP === req.headers.host) {
      addIP2BotList(ip, 'hit-the-ip')
    }
  }

  if (process.env.ANALYTICS_INCLUDE || process.env.ANALYTICS_EXCLUDE) {
    if (skipTracking(req.originalUrl)) return next()
  } else { // only log reqs to the homepage by default
    if (req.originalUrl !== '/') return next()
  }

  // console.log(req.originalUrl);

  const dev = device(req.headers['user-agent'], { parseUserAgent: true })
  const data = {
    timestamp: Date.now(),
    ip: ip,
    url: {
      host: req.headers.host,
      path: req.originalUrl
    },
    device: {
      type: dev.type,
      model: dev.model
    },
    agent: dev.parser.useragent,
    referer: req.headers.referer,
    origin: req.headers.origin,
    language: req.headers['accept-language']
  }

  if (process.env.ANALYTICS_POST_DATA) {
    // record specific data sent via POST reqs
    data.posted = getPostData(req.body)
  }

  const f = '?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query'
  exec(`curl http://ip-api.com/json/${data.ip}${f}`, (err, stdout) => {
    if (err) data.geo = 'curl failed'
    else data.geo = JSON.parse(stdout)
    logData(data)
  })

  next()
}
