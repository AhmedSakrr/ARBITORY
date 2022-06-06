//import webSocket from './utils/webSocket.js'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import { RunInits } from './socketasClient.js';


const appSocket = express();
const server = createServer(appSocket);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

let coins = new Object()

io.on('connection', socket => {
    console.log('connection made successfully')
    socket.on('message', payload => {
        console.log('Message received on server: ', payload)
        
        if (payload.message == 'TriggerFetching') {
            RunInits()
          }
        //io.emit('message',payload)
    })

    socket.on("disconnect", (reason) => {
        console.log('disconnection made successfully')
    });
})

export {server, io}