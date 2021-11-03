const $ = (sel) => {
  const ez = [...document.querySelectorAll(sel)]
    .map(e => { e.on = e.addEventListener; return e })
  if (ez.length === 1) return ez[0]
  else return ez
}

window.postLogin = (clickSel, passSel, callback) => {
  const postIt = () => {
    const opts = {
      method: 'post',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: window.location.pathname,
        password: $(passSel).value
      })
    }
    window.fetch('/api/login', opts)
      .then(res => res.json())
      .then(data => callback(data))
      .catch(err => console.error(err))
  }

  $(clickSel).on('click', () => postIt())
  $(passSel).on('keypress', (e) => {
    if (e.keyCode === 13) postIt()
  })
}

window.adminLogout = (clickSel) => {
  $(clickSel).on('click', () => {
    window.fetch('/api/admin-logout', { method: 'POST' })
      .then(res => res.json())
      .then(data => { window.location = window.location.origin + '/login' })
      .catch(err => console.error(err))
  })
}
