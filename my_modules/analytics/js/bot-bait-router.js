const fs = require('fs')
const express = require('express')
const router = express.Router()
const path = process.env.ANALYTICS_BOTS_PATH + '/suspected.json'

fs.stat(path, (err, stat) => {
  if (err && err.code === 'ENOENT') {
    const init = '{"took-the-bait":[],"hit-the-ip":[],"data-center":[],"proxy":[],"flagged":[]}'
    fs.writeFileSync(path, init)
  }
})

router.get('/bot-bait', async (req, res) => {
  res.send('oh hi!')
})

module.exports = router
