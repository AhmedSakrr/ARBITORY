import express from "express"
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cookieParser())


import userRouter from './routes/userRoutes.js'

//middleware
import errorHandlerMiddleware from './middleware/error-handler.js'
import NotFoundMiddleware from './middleware/not-found.js'
import authenticateUser from './middleware/authenticate.js'


app.get('/', (req, res) => {
    res.send('Welcome!')
})


if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
}


app.use(express.json())

app.use('/api/v1/auth', userRouter)
app.use(NotFoundMiddleware)
app.use(errorHandlerMiddleware)

export default app