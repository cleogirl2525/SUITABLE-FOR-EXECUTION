require('dotenv').config()

const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const https = require('https')
const SocketsServer = require('socket.io')
const ANALYTICS = require('./my_modules/analytics')
const SOCKETS = require('./my_modules/sockets.js')
const ROUTES = require('./my_modules/routes.js')
const dev = process.env.DEV

ANALYTICS.setup(app, {
  path: path.join(__dirname, 'data/analytics'),
  track: {
    include: ['/', '/api/login', '/show'],
    // exclude: ['*.css', '*.js'],
    post: ['password']
  },
  auth: {
    login: '/login',
    cookie: 'AdminToken',
    secret: process.env.JWT_SECRET,
    api: true,
    gui: true
  },
  bots: {
    path: path.join(__dirname, 'data/bots'),
    ip: '134.209.123.184'
  }
})

app.use(express.static(`${__dirname}/www`))
app.use(ROUTES)

const io = new SocketsServer()
io.on('connection', (socket) => SOCKETS(socket, io))

if (dev) { // development
  const httpServer = http.createServer(app)
  httpServer.listen(3000, () => console.log('listening on 3000'))
  io.attach(httpServer)
} else { // production
  const credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/suitableforexecution.live/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/suitableforexecution.live/cert.pem', 'utf8'),
    ca: fs.readFileSync('/etc/letsencrypt/live/suitableforexecution.live/chain.pem', 'utf8')
  }

  // const httpServer = http.createServer(app)
  const httpsServer = https.createServer(credentials, app)

  // httpServer.listen(80, () => console.log('HTTP listening on port 80'))
  httpsServer.listen(443, () => console.log('HTTPS listening on port 443'))

  // io.attach(httpServer)
  io.attach(httpsServer)
}
