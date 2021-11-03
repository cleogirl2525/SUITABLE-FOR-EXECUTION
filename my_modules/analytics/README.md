
# .env variables (optional)
ANALYTICS_DATA_PATH
// others in index.js

# dependencies
device
dotenv
jsonwebtoken
body-parser
cookie-parser


# example

place before all other routes that need to be tracked

```js
app.use(ANALYTICS.log)

// OR

ANALYTICS.setup(app, {
  path: path.join(__dirname, 'data'), // to store data
  track: { // use either include or exclude
    include: ['/'],
    // exclude: ['*.css', '*.js'],
    post: ['username']
  },
  auth: { // for REST API && GUI
    login: '/login', // path to admin login page
    cookie: 'AdminToken', // name of cookie w/jwt token
    secret: process.env.JWT_SECRET, // jwt secret
    api: true, // serve the REST API at /api/analytics
    gui: true // serve the analytics dashboard at /analytics
  },
  bots: { // setup bait trap to catch bots
    path: path.join(__dirname, 'data/bots'), // to store bots
    ip: '134.209.123.184' // additional vector to catch bots
  }
})
```
