/* global io */
const socket = io()
const mycolor = { fg: 'white', bg: 'blue', admin: null }
const sendBtn = document.querySelector('#chat-box > button')
const sendMsg = document.querySelector('#chat-box > input')
sendMsg.value = ''

// via: https://awik.io/determine-color-bright-dark-using-javascript/
function isLight (color) {
  // Variables for red, green, blue values
  let r, g, b
  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)
    r = color[1]
    g = color[2]
    b = color[3]
  } else {
    // If hex --> Convert it to RGB: http://gist.github.com/983661
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'))
    r = color >> 16
    g = color >> 8 & 255
    b = color & 255
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))

  // Using the HSP value, determine whether the color is light or dark
  return hsp > 127.5
}

function newChat (data) {
  let user = data.user || socket.id
  const c = data.color || mycolor.bg
  const u = { bg: c, fg: isLight(c) ? 'black' : 'white' }
  const t = { bg: c, fg: isLight(c) ? 'black' : 'white' }
  if (data.color) {
    u.bg = 'black'; u.fg = data.color
    t.bg = 'black'; t.fg = 'white'
  }
  if (c === mycolor.admin) {
    user = '[SYS_OP]'
    u.bg = c; u.fg = isLight(c) ? 'black' : 'white'
    t.bg = c; t.fg = isLight(c) ? 'black' : 'white'
  }
  const div = document.createElement('div')
  div.className = 'chat-message'
  div.innerHTML = `
    <span>
      <span style="background: ${u.bg}; color: ${u.fg}">${user}</span> |
    </span>
    <span>
      <span style="background: ${t.bg}; color: ${t.fg}">${data.message}</span>
    </span>
  `
  document.querySelector('#chat-window').appendChild(div)
}

function scrollToBottom () {
  const cw = document.querySelector('#chat-window')
  cw.scrollTop = cw.scrollHeight
}

function sendMessage () {
  newChat({ message: sendMsg.value })
  socket.emit('new-message', sendMsg.value)
  sendMsg.value = ''
  scrollToBottom()
}

function createCounter (marquee, data) {
  const div = document.createElement('div')
  div.style.background = data.color
  div.style.color = isLight(data.color) ? 'black' : 'white'
  div.style.padding = '4px'
  div.style.textAlign = 'center'
  marquee.parentNode.replaceChild(div, marquee)
  const targ = new Date()
  targ.setMinutes(targ.getMinutes() + 5) // 5 mins
  const targSecs = targ.getMinutes() * 60 + targ.getSeconds()
  setInterval(function () {
    const now = new Date()
    const nowSecs = now.getMinutes() * 60 + now.getSeconds()
    const timeleft = targSecs - nowSecs
    let s = timeleft % 60
    s = (String(s).length === 2) ? s : '0' + s
    let m = parseInt(timeleft / 60)
    m = (String(m).length === 2) ? m : '0' + m
    if (timeleft <= 0) {
      window.close()
      window.opener.location.reload()
    } else {
      div.textContent = `countdown: ${m}:${s}`
    }
  }, 500)
}

sendBtn.addEventListener('click', () => sendMessage())

sendMsg.addEventListener('keypress', (e) => {
  if (e.keyCode === 13) sendMessage()
})

socket.on('init-chat', (data) => {
  const m = document.querySelector('marquee')
  m.style.background = data.color
  m.style.color = isLight(data.color) ? 'black' : 'white'
  if (window.location.hash === '#counter') createCounter(m, data)
  document.querySelector('#chat-box').style.background = data.color
  mycolor.bg = data.color
  mycolor.fg = isLight(data.color) ? 'black' : 'white'
  mycolor.admin = data.admin
  data.chats.forEach(d => newChat(d))
  scrollToBottom()
})

socket.on('message-broadcast', (data) => {
  newChat(data)
})

socket.on('sysop-message', (data) => {
  // TODO: maybe base this on AdminToken?
})

window.addEventListener('resize', () => scrollToBottom())
