const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const id2clr = {}
const adminClr = '#ef04b1'

function ranClr () {
  const c = '#' + Math.floor(Math.random() * 16777215).toString(16)
  if (c === adminClr) return ranClr()
  else return c
}

function dateStr (date) {
  const yer = date.getFullYear()
  let mon = date.getMonth() + 1
  // let day = date.getDate()
  mon = String(mon).length === 1 ? '0' + mon : mon
  // day = String(day).length === 1 ? '0' + day : day
  // return `${yer}-${mon}-${day}`
  return `${yer}-${mon}`
}

function getFilePath () {
  const date = dateStr(new Date())
  const fp = path.join(__dirname, `../data/chats/${date}.json`)
  try { fs.statSync(fp) } catch (err) { fs.writeFileSync(fp, '[]') }
  return fp
}

function getChatLogs () {
  const filepath = getFilePath()
  const data = fs.readFileSync(filepath, 'utf8')
  return JSON.parse(data)
}

function addToChatLogs (data) {
  const filepath = getFilePath()
  const logs = getChatLogs()
  logs.push(data)
  fs.writeFile(filepath, JSON.stringify(logs), (err) => {
    if (err) console.log(err)
  })
}

function someoneLoggedOff (socket, io) {
  // console.log(`${socket.id} is gone!`)
  delete id2clr[socket.id]
}

async function someoneLoggedOn (socket, io) {
  const adminToken = socket.handshake.headers.cookie
    .split(';')
    .filter(cookie => cookie.includes('AdminToken'))
    .map(data => data.split('=')[1])[0]

  const isAdmin = adminToken
    ? await jwt.verify(adminToken, process.env.JWT_SECRET)
    : false

  id2clr[socket.id] = isAdmin ? adminClr : ranClr()

  socket.emit('init-chat', {
    color: id2clr[socket.id],
    admin: adminClr,
    chats: getChatLogs()
  })
  // console.log(`${socket.id} connected!`)
}

function clientSentMessage (socket, io, msg) {
  const data = {
    user: socket.id,
    color: id2clr[socket.id],
    message: msg
  }
  addToChatLogs(data)
  socket.broadcast.emit('message-broadcast', data)
  // console.log(`${socket.id} said: ${msg}`)
}

module.exports = (socket, io) => {
  // connected = io.sockets.clients().connected
  someoneLoggedOn(socket, io)
  socket.on('disconnect', () => { someoneLoggedOff(socket, io) })
  socket.on('new-message', (m) => { clientSentMessage(socket, io, m) })
}
