const fs = require('fs')
const express = require('express')
const cookieParser = require('cookie-parser')
const router = express.Router()
const { checkForToken } = require('./utils.js')
const dataPath = process.env.ANALYTICS_DATA_PATH

router.use(cookieParser())

function genOpts (url) {
  const ips = url.ips
    ? url.ips.split(',').map(s => s.trim()).filter(s => s !== '')
    : null
  return {
    dateRange: {
      start: url.start || '1970-01-01',
      end: url.end || '9999-01-01'
    },
    ips: ips,
    host: url.host || null,
    path: url.path || null,
    // bot filters
    botFilter: {
      crawler: url['x-bot-crawler'] === 'true',
      tookBait: url['x-bot-took-bait'] === 'true',
      hitIp: url['x-bot-hit-ip'] === 'true',
      flagged: url['x-bot-flagged'] === 'true',
      dataCenter: url['x-bot-data-center'] === 'true',
      proxy: url['x-bot-proxy'] === 'true'
    },
    // select filters
    device: url.device || null,
    client: url.client || null,
    OppSys: url.OppSys || null,
    lang: url.lang || null,
    city: url.city || null,
    region: url.region || null,
    country: url.country || null,
    AtonSys: url.AtonSys || null,
    ISP: url.ISP || null,
    ORG: url.ORG || null
  }
}

function createDataObj (opts) {
  let data = []
  let files = fs.readdirSync(dataPath)
  const df = opts.dateRange.start !== '1970-01-01' ||
    opts.dateRange.end !== '9999-01-01'
  if (df) { // filter out files that fall outside the date range
    const s = new Date(opts.dateRange.start)
    const e = new Date(opts.dateRange.end)
    files = files.filter(f => {
      const day = f.split('.')[0]
      const d = new Date(day)
      return d >= s && d <= e
    })
  }
  // combine into one array
  files.filter(f => f !== '.gitkeep').forEach(file => {
    const s = fs.readFileSync(`${dataPath}/${file}`, 'utf8')
    const arr = JSON.parse(s)
    data = [...data, ...arr]
  })
  return data
}

function filterDataObj (data, opts) {
  const susPath = process.env.ANALYTICS_BOTS_PATH + '/suspected.json'
  const sus = JSON.parse(fs.readFileSync(susPath, 'utf8'))

  return data.filter(o => {
    let f = true
    const ip = o.ip.includes('ffff:') ? o.ip.split('ffff:')[1] : o.ip
    if (f && opts.host) { f = opts.host === o.url.host }
    if (f && opts.path) { f = opts.path === o.url.path }
    if (f && opts.ips && opts.ips.length > 0) {
      f = opts.ips.includes(ip)
    }
    if (f && opts.device) { f = opts.device === o.device.type }
    if (f && opts.client) { f = opts.client === o.agent.family }
    if (f && opts.OppSys) { f = opts.OppSys === o.agent.os.family }
    if (f && opts.lang) { f = opts.lang === o.language }
    if (f && opts.city) { f = opts.city === o.geo.city }
    if (f && opts.region) { f = opts.region === o.geo.regionName }
    if (f && opts.country) { f = opts.country === o.geo.country }
    if (f && opts.AtonSys) { f = opts.AtonSys === o.geo.as }
    if (f && opts.ISP) { f = opts.ISP === o.geo.isp }
    if (f && opts.ORG) { f = opts.ORG === o.geo.org }
    if (f && opts.botFilter) {
      const crawler = o.device.type === 'bot'
      const tookBait = sus['took-the-bait'].includes(ip)
      const hitIp = sus['hit-the-ip'].includes(ip)
      const flagged = sus.flagged.includes(ip)
      const dataCenter = sus['data-center'].includes(ip)
      const proxy = sus.proxy.includes(ip)
      if (opts.botFilter.crawler && crawler) f = false
      if (opts.botFilter.tookBait && tookBait) f = false
      if (opts.botFilter.hitIp && hitIp) f = false
      if (opts.botFilter.flagged && flagged) f = false
      if (opts.botFilter.dataCenter && dataCenter) f = false
      if (opts.botFilter.proxy && proxy) f = false
    }
    return f
  })
}

router.get('/api/analytics', async (req, res) => {
  const o = await checkForToken(req, res)
  if (o.error) res.json(o)
  const opts = genOpts(req.query)
  const logs = createDataObj(opts)
  const data = filterDataObj(logs, opts)
  return res.json({ data, opts })
})

router.get('/api/analytics-bots', async (req, res) => {
  const o = await checkForToken(req, res)
  if (o.error) res.json(o)
  const susPath = process.env.ANALYTICS_BOTS_PATH + '/suspected.json'
  const sus = JSON.parse(fs.readFileSync(susPath, 'utf8'))
  return res.json(sus)
})

router.post('/api/analytics-flag-bot', async (req, res) => {
  const o = await checkForToken(req, res)
  if (o.error) res.json(o)
  if (!req.body.ip) res.json({ error: 'missing IP addresses' })
  const susPath = process.env.ANALYTICS_BOTS_PATH + '/suspected.json'
  const sus = JSON.parse(fs.readFileSync(susPath, 'utf8'))
  sus.flagged.push(req.body.ip)
  fs.writeFile(susPath, JSON.stringify(sus), (err) => {
    if (err) res.json({ error: err })
    else res.json({ message: `${req.body.ip} has been flagged` })
  })
})

module.exports = router
