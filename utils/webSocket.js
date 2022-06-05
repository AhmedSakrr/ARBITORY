//import webSocket from './utils/webSocket.js'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

import webSocket from 'ws'
import pako from 'pako'

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
        //io.emit('message',payload)
    })

    socket.on("disconnect", (reason) => {
        console.log('disconnection made successfully')
    });
})

var orderbook = {};

function handle(data) {
    // console.log('received', data.ch, 'data.ts', data.ts, 'crawler.ts', moment().format('x'));
    let symbol = data.ch.split('.')[1];
    let channel = data.ch.split('.')[2];
    switch (channel) {
        case 'kline':
            console.log('kline', data.tick);
            break;
        case 'trade':
            const random = Math.floor(Math.random() * 30)
            console.log("Huobi Rand: " + random)
            if (random > 1) {
                console.log(`HUOBI ${symbol} random: ` + random + " --- " + JSON.stringify(data.tick.data[0].price));
                coins[symbol.toUpperCase()] = { ...coins[symbol.toUpperCase()], name: symbol.toUpperCase(), priceHuobi: parseFloat(data.tick.data[0].price) }
                io.sockets.emit("message", coins);
            }
            break;
    }
}

function subscribe(ws, market) {

    switch (market) {

        case 'Huobi':
            console.log("Subscribing to Huobi")
            var symbols = ['btcusdt', 'ethusdt'];
            for (let symbol of symbols) {
                ws.send(JSON.stringify({
                    "sub": `market.${symbol}.trade.detail`,
                    "id": `${symbol}`
                }));
            }
            break;

        case 'Binance':
            console.log("Subscribing to Binance")
            var symbols = ['lunaust@trade', 'ethusdt@trade'];
            ws.send(JSON.stringify(
                {
                    "method": "SUBSCRIBE",
                    "params": symbols,
                    "id": 1
                }))
            break;
    }
}


function init(market) {
    let WS_URL = ""

    switch (market) {
        case 'Huobi': WS_URL = "wss://api.huobi.pro/ws"; break;
        case 'Binance': WS_URL = "wss://stream.binance.com:9443/ws/lunaust@trade"; break;
    }

    var ws = new webSocket(WS_URL);

    ws.on('open', () => {
        console.log(`Connected ${market}`);
        market == "Huobi" ? subscribe(ws, market) : null
    });

    ws.on('message', (data) => {

        if (market == "Huobi") {
            let text = pako.inflate(data, {
                to: 'string'
            });
            let msg = JSON.parse(text);
            if (msg.ping) {
                ws.send(JSON.stringify({
                    pong: msg.ping
                }));
            }
            else if (msg.tick) {
                //console.log(msg);
                handle(msg);
            } else {
                console.log(text);
            }
        }
        else if (market == "Binance") {
            const random = Math.floor(Math.random() * 30)
            console.log("Binance Rand: " + random)
            if (random > 1) {
                console.log("BINANCE random: " + random + " ---- " + JSON.parse(data).s + " PRICE " + JSON.parse(data).p)
                coins[JSON.parse(data).s] = { ...coins[JSON.parse(data).s], name: JSON.parse(data).s, priceBinance: parseFloat(JSON.parse(data).p) }
                io.sockets.emit("message", coins);
            }
        }

    });
    ws.on('close', () => {
        console.log(`Disconnected from ${market}`);
        //init(market);
    });
    ws.on('error', err => {
        console.log(`Error occured by ${market} ERR0R: ` + err);
        //init(market);
    });
}

//init("Huobi");
init("Binance");


export default server