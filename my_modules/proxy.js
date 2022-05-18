const path = require('path')

const hostDict = {
  'dewclaw.live': '../dewclaw_live'
}

const urlParse = (host, url) => {
  if (url === '/') {
    return hostDict[host] + '/index.html'
  } else {
    return hostDict[host] + url
  }
}

module.exports = (req, res, next) => {
  const host = req.headers.host
  const url = req.originalUrl
  if (hostDict[host]) {
    console.log(host, url)
    const newURL = urlParse(host, url)
    res.sendFile(path.join(__dirname, newURL))
  } else next()
}
