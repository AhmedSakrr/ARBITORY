//import webSocket from './utils/webSocket.js'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

import webSocket from 'ws'


const appSocket = express();
const server = createServer(appSocket);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on('connection', socket => {
    console.log('connection made successfully')
    socket.on('message', payload => {
        console.log('Message received on server: ', payload)
        //io.emit('message',payload)
    })

    socket.on("disconnect", (reason) => {
        console.log('disconnection made successfully')
    });
})

const ws = new webSocket('wss://stream.binance.com:9443/ws/btcusdt@trade')

ws.on('open', function incoming(data) {
    console.log('connection to Binance made successfully')
})

ws.on('message', function incoming(data) {
    const currentDateTime = new Date();
    let resultInSeconds=currentDateTime.getTime() / 1000;
    const a = resultInSeconds.toString().slice(-1)
    if(parseInt(a) >8){
        console.log(JSON.parse(data).p)
        io.sockets.emit("message", JSON.parse(data).p);
    }
})

export default server