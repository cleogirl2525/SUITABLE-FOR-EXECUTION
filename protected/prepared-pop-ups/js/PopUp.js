/* global Maths */
/*
  TODO:

  https://stackoverflow.com/questions/69588468/window-moveto-placing-window-at-half-of-the-passed-arguments-in-firefox

  sceenX && screenY not updating in firefox (could be 2nd monitor issues?)

  screenY seems to be adding 37px from the value passed in opts.y?

  const name = 'test'

  window.pops[name] = new PopUp({
    name,
    href: 'test.html',
    x: 100,
    y: 100,
    width: 200,
    height: 200
  })

*/
class PopUp {
  constructor (opts) {
    const w = (typeof opts.width === 'number') ? opts.width : 400
    const h = (typeof opts.height === 'number') ? opts.height : 280
    const x = (typeof opts.x === 'number') ? opts.x : window.screenX
    const y = (typeof opts.y === 'number') ? opts.y : window.screenY

    this.updateParams({ x, y, w, h })
    this.name = opts.name || ''
    this.id = opts.id
    this.href = opts.href
    this.type = opts.type || 'relative'
    if (!this.href) this.err(0, 'href')

    window.addEventListener('beforeunload', () => this.close())
  }

  get x () { return this.win.screenX }
  set x (v) { this.err(1, 'x') }

  get y () { return this.win.screenY }
  set y (v) { this.err(1, 'y') }

  get width () { return this.win.innerWidth }
  set width (v) { this.err(1, 'width') }

  get height () { return this.win.innerHeight }
  set height (v) { this.err(1, 'height') }

  get home () { return this.win.opener }
  set home (v) { this.err(1, 'home') }

  // ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ .

  err (n, args) {
    const a = typeof args === 'string' ? args : args[0]
    this.errz = [
      `PopUp: missing ${a} parameter`,
      `PopUp: the ${a} property is read only`
    ]
    console.error(this.errz[n])
  }

  updateParams (opts) {
    if (!this._p) this._p = opts
    this._p.x = typeof opts.x === 'number' ? opts.x : this._p.x
    this._p.y = typeof opts.y === 'number' ? opts.y : this._p.y
    this._p.w = typeof opts.w === 'number' ? opts.w : this._p.w
    this._p.h = typeof opts.h === 'number' ? opts.h : this._p.h
    this.params = `width=${this._p.w},height=${this._p.h},left=${this._p.x},top=${this._p.y},scrollbars=no`
  }

  // ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ . _ . ~ * ~ .

  open () {
    this.win = window.open(this.href, this.name, this.params)
    this.win.addEventListener('beforeunload', () => this.close())
  }

  close () {
    if (this.win) this.win.close()
  }

  moveTo (x, y) {
    this.updateParams({ x, y })
    if (this.win) this.win.moveTo(x, y)
  }

  setSize (w, h) {
    this.updateParams({ w, h })
    if (this.win) this.win.resizeTo(w, h)
  }

  tweenTo (x, y, t, e = 'easeInQuad', f, i = 0) {
    const to = { x, y }
    const from = f || { x: this.x, y: this.y }

    if (this.tweenTimer) clearTimeout(this.tweenTimer)

    const dur = t || 2 // duration in seconds
    const fps = 1000 / 30 // 30 frames per second
    const inc = 1 / dur / fps
    i += inc
    if (i >= 1) return
    const pos = Maths[e](i)
    const X = Maths.map(pos, 0, 1, from.x, to.x)
    const Y = Maths.map(pos, 0, 1, from.y, to.y)
    // console.log(`${pos} | ${from.y} >> ${to.y} | ${Y}`);
    this.moveTo(X, Y)

    this.tweenTimer = setTimeout(() => {
      this.tweenTo(x, y, dur, e, from, i)
    }, fps)
  }
}

window.PopUp = PopUp
