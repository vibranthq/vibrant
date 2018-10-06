import express from 'express'
import AuthRouter from './routes/auth'

const app = express()

app.use('/auth', AuthRouter)
