import dotenv from 'dotenv'
import 'express-async-errors'

import connectDB from './db/connect.js'
dotenv.config()



const port = process.env.port || 5000

import app from './app.js'

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL)
        app.listen(port, () => console.log(`Server is listening on port ${port}...`))
    } catch (error) {
        console.log(`MongoError`)
    }
}

start()



import server from './utils/webSocketServer.js'


server.listen(7000,()=>{
    console.log('Listening socket server at port: 7000)');
})