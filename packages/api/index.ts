import express, { Router, Request, Response, NextFunction } from 'express'
import expressSession from 'express-session'
import passport from 'passport'
import {
  Strategy as Auth0Strategy,
  AuthenticateOptions as Auth0AuthenticateOptions,
  Profile as Auth0Profile,
} from 'passport-auth0'
import bodyParser from 'body-parser'
import { AddressInfo } from 'net'

interface GitHubProfile extends Auth0Profile {
  emails: { value: string }[]
  nickname: string
  picture: string
}

const auth0Strategy = new Auth0Strategy(
  {
    clientID: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    domain: process.env.AUTH0_DOMAIN!,
    callbackURL:
      process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/auth/callback',
    state: false,
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    console.log('auth0Strately:callback function1')
    console.log('/auth/callback')

    const user = {
      socialID: profile.id, // if github, would be 'github|<number>'
      displayName: profile.displayName, // Yasuaki Uechi (inconsistent)
      email: (<GitHubProfile>profile).emails[0].value, // y@uechi.io (inconsistent)
      nickname: (<GitHubProfile>profile).nickname, // uetchy (inconsistent)
      avatarURL: (<GitHubProfile>profile).picture,
    }
    console.log('user:', user)

    return done(null, user)
  }
)

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(
//   expressSession({
//     resave: true,
//     saveUninitialized: true,
//     secret: 'supersecret',
//   })
// )
app.use(passport.initialize())
// app.use(passport.session())
passport.serializeUser(function(user, done) {
  console.log('serializeUser')
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  console.log('deserializeUser')
  done(null, user)
})
passport.use(auth0Strategy)

app.get(
  '/auth/github',
  passport.authenticate('auth0', <Auth0AuthenticateOptions>{
    connection: 'github',
    scope: 'openid email profile', // required
  })
)

app.get(
  '/auth/callback',
  (req, res, next) => {
    // State value is in req.query.state ...
    console.log('callback query:', req.query)
    next()
  },
  passport.authenticate('auth0', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    console.log('req.user', req.user)
    console.log('isAuthenticated', req.isAuthenticated())
    console.log('session', req.session)
    console.log('_passport', (<any>req)._passport)

    res.redirect(req.session!.returnTo || '/')
  }
)

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

export const isAuthorized = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const provider = req.path.split('/').slice(-1)[0]

  if (req.user.tokens.any((token: any) => token.kind === provider)) {
    next()
  } else {
    res.redirect(`/auth/${provider}`)
  }
}

const server = app.listen(process.env.PORT || 3000, () => {
  const { port } = server.address() as AddressInfo
  console.log(`http://localhost:${port}`)
})
