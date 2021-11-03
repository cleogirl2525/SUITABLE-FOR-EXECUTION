/* global $ */
function handleResponse (data) {
  if (data.error) handleError(data.error)
  else {
    $('.message').textContent = data.message
    $('#new-pw').value = ''
    fetchList((list) => {
      $('.data').innerHTML = ''
      for (const pw in list) createPwStat(pw, list[pw])
    })
    setTimeout(() => {
      $('.message').style.opacity = 0
      setTimeout(resetMsg, 1100)
    }, 3000)
  }
}

function handleError (err) {
  $('.message').style.opacity = 1
  $('.message').style.color = '#FC7575'
  $('.message').textContent = err
}

function resetMsg () {
  $('.message').style.opacity = 1
  $('.message').style.color = '#82E22E'
  $('.message').textContent = ''
}

function postData () {
  resetMsg()
  const opts = {
    method: 'post',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: $('#new-pw').value })
  }
  window.fetch('/api/new-audience-pw', opts)
    .then(res => res.json())
    .then(data => handleResponse(data))
    .catch(err => handleError(err))
}

function fetchList (cb) {
  window.fetch('/api/pw-list')
    .then(res => res.json())
    .then(data => cb(data))
    .catch(err => console.log(err))
}

function deletePW (e) {
  const opts = {
    method: 'post',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: e.target.dataset.pw })
  }
  window.fetch('/api/delete-pw', opts)
    .then(res => res.json())
    .then(data => handleResponse(data))
    .catch(err => handleError(err))
}

function copied (ele, str) {
  if (str.includes('copied IP!')) str = str.split('!')[1].trim()
  navigator.clipboard.writeText(str)
  ele.querySelector('.copied').style.display = 'inline-block'
  setTimeout(() => {
    ele.querySelector('.copied').style.opacity = 0
    setTimeout(() => {
      ele.querySelector('.copied').style.display = 'none'
      ele.querySelector('.copied').style.opacity = 1
    }, 1100)
  }, 100)
}

function createPwStat (name, arr) {
  const row = document.createElement('div')
  row.className = 'pw-row'
  row.innerHTML = `
    <div>
      <span class="pw">
        <span class="copied">copied password!</span> ${name}
      </span>
      <span>${arr.length} hit${arr.length === 1 ? '' : 's'}</span>
      <span>
        <button class="delete" data-pw="${name}">DELETE PW</button>
      </span>
    </div>
    <div class="details" style="display: none;"></div>
  `
  arr.forEach(hit => {
    const ele = document.createElement('div')
    ele.innerHTML = `
      <span class="ip">
        <span class="copied">copied IP!</span>${hit.ip}
      </span>
      <span>${new Date(hit.timestamp).toLocaleString()}</span>
      <span>(${hit.type})</span>
    `
    ele.querySelector('.ip').addEventListener('click', (e) => {
      copied(e.target, e.target.textContent)
    })
    row.querySelector('.details').appendChild(ele)
  })

  row.querySelector('.pw').addEventListener('click', e => {
    const d = row.querySelector('.details').style.display === 'block'
    if (d) {
      row.querySelector('.details').style.display = 'none'
    } else {
      row.querySelector('.details').style.display = 'block'
      copied(row, name)
    }
  })

  row.querySelector('.delete').addEventListener('click', deletePW)

  $('.data').appendChild(row)
}

// SRUN ETUP

fetchList((list) => {
  for (const pw in list) createPwStat(pw, list[pw])
})

$('#add').on('click', () => postData())

$('#new-pw').on('keypress', (e) => {
  resetMsg(); if (e.keyCode === 13) postData()
})
