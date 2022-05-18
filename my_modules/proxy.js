const path = require('path')

const hostDict = {
  'dewclaw.live': '../dewclaw_live/index.html'
}

const urlPass = (host, url) => {
  if (url === '/') return true
  else return false
}

module.exports = (req, res, next) => {
  const host = req.headers.host
  const url = req.originalUrl
  if (hostDict[host] && urlPass(host, url)) {
    console.log(host, url)
    res.sendFile(path.join(__dirname, hostDict[host]))
  } else next()
}
