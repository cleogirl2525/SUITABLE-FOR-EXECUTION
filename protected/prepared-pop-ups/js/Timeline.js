class Timeline {
  constructor () {
    this.track = null
    this.duration = null
    this.timecodes = {}
  }

  // --//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--

  load (keyframes, trackSelector) {
    this.timecodes = {}
    for (const t in keyframes) {
      this.timecodes[t] = {}
      this.timecodes[t].time = t
      this.timecodes[t].ran = false
      this.timecodes[t].popups = keyframes[t]
    }

    if (!this.track || trackSelector) {
      const tsel = trackSelector || '#track'
      this.track = document.querySelector(tsel)
    }

    this.track.addEventListener('waiting', () => { /* loading */ })
    this.track.addEventListener('ended', () => this.reset())
    this.track.addEventListener('loadedmetadata', () => {
      this.duration = this.track.duration
    })
  }

  update (callback) {
    const kf = this._mostRecentKeyframe()
    if (kf && !kf.ran) {
      if (callback) callback(kf.popups)
      kf.ran = true
    }
  }

  reset (callback) {
    const kf = this._mostRecentKeyframe()
    for (const tc in this.timecodes) {
      if (Number(tc) < Number(kf.time)) this.timecodes[tc].ran = true
      else this.timecodes[tc].ran = false
    }
    const ct = this.track.currentTime
    if (ct !== this.duration) this.update(callback)
  }

  getFirstKeyFrameFor (id) {
    let firstKeyFrame
    const arr = Object.keys(this.timecodes).sort((a, b) => a - b)
    for (let i = 0; i < arr.length; i++) {
      const keyframes = this.timecodes[arr[i]].popups
      const data = keyframes.filter(p => p.id === id)
      if (data.length > 0) { firstKeyFrame = data[0]; break }
    }
    return firstKeyFrame
  }

  getAllIds () {
    const ids = []
    for (const t in this.timecodes) {
      const arr = this.timecodes[t].popups
      arr.forEach(p => {
        if (!ids.includes(p.id)) ids.push(p.id)
      })
    }
    return ids
  }

  // --//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--//--

  _mostRecentKeyframe (time) {
    const ct = time || this.track.currentTime
    const kf = Object.keys(this.timecodes)
      .filter(tc => ct >= tc)
      .sort((a, b) => a - b)
      .reverse()[0]
    return this.timecodes[kf]
  }
}

window.Timeline = Timeline
