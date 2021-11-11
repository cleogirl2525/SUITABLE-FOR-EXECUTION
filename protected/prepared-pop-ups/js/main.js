/* global Timeline, PopUp */
async function main () {
  const timeline = new Timeline()
  const track = document.querySelector('#track')
  const start = document.querySelector('button#start')
  const mdres = await window.fetch('metadata.json')
  const mdata = await mdres.json()
  const pdict = {} // pop up dictionary

  // launch first popup (loading screen) when user presses start button
  start.addEventListener('click', () => {
    const w = 100
    const h = 50
    const x = (window.screen.width / 2) - (w / 2)
    const y = (window.screen.height / 2) - (h / 2)
    const props = `width=${w},height=${h},left=${x},top=${y},scrollbars=no`
    window.open('loading.html', 'loading', props)
  })

  // when loading screen is finished, it calls this function
  window.startTrack = () => {
    start.style.display = 'none'
    track.style.display = 'block'
    track.play()
  }

  timeline.load(mdata.keyframes, '#track')

  // setup the popups dictionary object
  mdata.popups.forEach(pop => {
    const first = timeline.getFirstKeyFrameFor(pop.id)
    const opts = { ...pop, ...first }
    pdict[pop.id] = new PopUp(opts)
  })

  // setup audio track + timeline logix
  track.src = mdata.track

  track.addEventListener('timeupdate', () => {
    if (track.paused) {
      timeline.reset((popups) => {
        const ids = popups.map(p => p.id)
        for (const popup in pdict) {
          if (!ids.includes(pdict[popup].id)) pdict[popup].close()
        }
        popups.forEach(pop => {
          pdict[pop.id].open()
          pdict[pop.id].setSize(pop.width, pop.height)
          pdict[pop.id].moveTo(pop.x, pop.y)
        })
      })
    } else {
      // ----------------------------------- ANIMATE KEYFRAME ------------------
      timeline.update((popups) => {
        const showing = popups.map(p => p.id)
        for (const id in pdict) {
          const pop = pdict[id]
          if (!showing.includes(pop.id)) pop.close()
          else {
            const opts = popups.filter(p => p.id === pop.id)[0]

            const x = (opts.type === 'exact')
              ? opts.x : (opts.x / opts.screen.width) * window.screen.availWidth
            const y = (opts.type === 'exact')
              ? opts.y : (opts.y / opts.screen.height) * window.screen.availHeight
            const w = (opts.type === 'exact')
              ? opts.width : (opts.width / opts.screen.width) * window.screen.availWidth
            const h = (opts.type === 'exact')
              ? opts.height : (opts.height / opts.screen.height) * window.screen.availHeight

            pop.setSize(w, h)

            if (opts.ease !== 'none') {
              pop.open()
              pop.tweenTo(x, y, 0.5, opts.ease)
            } else {
              pop.moveTo(x, y)
              pop.open()
            }
          }
        }
      })
    }
  })
}

main()
