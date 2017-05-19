const {
  PORT=3000
} = process.env

const express = require('express')
const passport = require('passport')
const OAuth2Strategy = require('passport-oauth2')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const hbs = require('express-handlebars')
const fetch = require('node-fetch')

const app = express()

app.engine('handlebars', hbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

app.use(express.static(`${__dirname}/public`))
app.use(cookieParser())
app.use(session({
  secret: 'wallstreetdocs'
}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new OAuth2Strategy({
    authorizationURL: 'https://staging-auth.wallstreetdocs.com/oauth/authorize',
    tokenURL: 'https://staging-auth.wallstreetdocs.com/oauth/token',
    clientID: 'coding_test',
    clientSecret: 'bwZm5XC6HTlr3fcdzRnD',
    callbackURL: 'http://localhost:3000'
  },
  (accessToken, refreshToken, profile, cb) => cb(null, { accessToken, refreshToken })
))

passport.serializeUser((user, done) => done(null, JSON.stringify(user)));

passport.deserializeUser(function(user, done) {
  try {
    user = JSON.parse(user)
    done(null, user)
  } catch (err) {
    done(err)
  }
});

app.get('/auth', passport.authenticate('oauth2'))
app.get('/', passport.authenticate(
  'oauth2',
  { failureRedirect: '/dashboard' }),
  (req, res) => res.redirect('/user-profile')
)

app.use((req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.redirect('/')
})

app.get('/user-profile',  (req, res, next) => {
  const { accessToken } = req.user
  fetch('https://staging-auth.wallstreetdocs.com/oauth/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  .then(res => res.json())
  .then(user => res.render('user-profile', { user }))
  .catch(next)
})

app.listen(PORT, err => {
  if (err) process.exit(1)
  console.log('Listing on port', PORT)
})
