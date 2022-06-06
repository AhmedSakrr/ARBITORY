//import webSocket from './utils/webSocket.js'
import { server, io } from './socketasServer.js'

import webSocket from 'ws'
import pako from 'pako'
import axios from 'axios';


let coins = new Object()

let nextId = 1;

const init = async (market) => {
    let WS_URL = ""

    switch (market) {
        case 'Binance':
            WS_URL = "wss://stream.binance.com:9443/ws/@trade"; break;
        case 'FTX':
            WS_URL = "wss://ftx.com/ws/"; break;
        case 'Kucoin':
            let res = await axios.post('https://openapi-v2.kucoin.com/api/v1/bullet-public', "")
            const WS_URL_TOKEN = res.data.data.token;
            const WSURL = res.data.data.instanceServers[0].endpoint
            const date = new Date()
            const ticks = date.getTime()
            WS_URL = WSURL + "?token=" + WS_URL_TOKEN + "&[connectId=" + ticks + "]"; break;
        case 'Huobi':
            WS_URL = "wss://api.huobi.pro/ws"; break;
        case 'BitFinex':
            WS_URL = "wss://api-pub.bitfinex.com/ws/2"; break;
    }

    try {
        var ws = new webSocket(WS_URL);
    } catch (error) {
        console.log("bağlanırken hata oldu.")
    }


    ws.on('open', (data) => {
        ws.id = "cnx" + market + " " + nextId++;
        console.log(`${ws.id} Connected ${market}`);
        market == "Binance" ? subscribe(ws, market) : null
        market == "FTX" ? subscribe(ws, market) : null
        market == "Huobi" ? subscribe(ws, market) : null
        market == "Kucoin" ? subscribe(ws, market) : null
        market == "BitFinex" ? subscribe(ws, market) : null
    });

    ws.on('message', (data) => {

        if (market == "Binance") {
            data = JSON.parse(data)
            handle(data, market)
        }
        else if (market == "FTX") {
            data = data.toString('utf8');
            let msg = JSON.parse(data);
            handle(msg, market)
        }
        else if (market == "BitFinex") {
            data = data.toString('utf8');
            let msg = JSON.parse(data);
            handle(msg, market)
        }
        else if (market == "Huobi") {
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
                handle(msg, market);
            } else {
                //console.log(text);
            }
        }
        else if (market == "Kucoin") {
            data = data.toString('utf8');
            let msg = JSON.parse(data);
            if (msg.type == "pong") {
                //console.log("pong received1 for " + market)
            } else if (msg.type == "message") {
                handle(msg, market);
            } else {
                //console.log("unhandled msg from kucoin. Message: ---------> ", data)
            }
        }

    });
    ws.on('close', () => {
        console.log(`Disconnected from ${market}`);
        //init(market);
    });
    ws.on('error', err => {
        console.log(`Error occured by ${market} ERR0R: ` + err);
        console.log("Connection closed for " + market + " " + ws.timer)
        ws.terminate()
        clearInterval(ws.timer)
        //init(market);
    });


    // P I N G  P O N G 
    ws.on('pong', (data) => {
        data = data.toString('utf8');
        //console.log(ws.id + "pong received for " + market + " : " + data);
    });

    ws.timer = setInterval(function () {
        if (ws.readyState == ws.CLOSED) {
            console.log("Connection closed." + ws.timer)
            console.log("Connection terminating..")
            ws.terminate()
            clearInterval(ws.timer)
        }
        pingpong(ws, market);
    }, 10000);
}


function pingpong(ws, market) {
    const date = new Date()
    const ticks = date.getTime()
    if (market == "Kucoin") {
        ws.ping(JSON.stringify({ "id": ticks, "type": "ping" }), {}, true);
    }
    else if (market == "FTX") {
        ws.ping(JSON.stringify({ 'op': 'ping' }), {}, true);
    }
    else if (market == "BitFinex") {
        console.log("Sending ping for bitfinex")
        ws.ping(JSON.stringify({ "event": "ping", "cid": ticks }), {}, true);
    }
}
// P I N G  P O N G 

// S U B S C R I B E  C O I N  P A I R S
function subscribe(ws, market) {

    //console.log("Subscriptiona geldi")
    switch (market) {

        case 'Binance':
            //console.log("Subscribing to Binance")
            const date2 = new Date()
            const ticks2 = date2.getTime()
            var symbols = ["ethbtc@trade", "ltcbtc@trade"];
            ws.send(JSON.stringify(
                {
                    "method": "SUBSCRIBE",
                    "params": symbols,
                    "id": ticks2
                }))
            break;

        case 'FTX':
            //console.log("Subscribing to FTX")
            var symbols = ['ETH/BTC', 'LTC/BTC'];
            for (let symbol of symbols) {
                ws.send(JSON.stringify(
                    { 'op': 'subscribe', 'channel': 'trades', 'market': symbol }))
            }
            break;

        case 'Huobi':
            //console.log("Subscribing to Huobi")
            var symbols = ['ethbtc', 'ltcbtc'];
            for (let symbol of symbols) {
                ws.send(JSON.stringify({
                    "sub": `market.${symbol}.trade.detail`,
                    "id": `${symbol}`
                }));
            }
            break;

        case 'Kucoin':
            //console.log("Subscribing to Kucoin")
            const date = new Date()
            const ticks = date.getTime()

            //"topic": "/market/ticker:BTC-USDT,DOGE-USDT",
            //"topic": "/market/ticker:all",
            ws.send(JSON.stringify(
                {
                    "id": ticks,
                    "type": "subscribe",
                    "topic": "/market/ticker:ETH-BTC,LTC-BTC",
                    "response": true
                }))
            break;

        case 'BitFinex':
            //console.log("Subscribing to BitFinex")
            var symbols = ['tETHBTC', 'tLTCBTC'];
            for (let symbol of symbols) {
                ws.send(JSON.stringify({
                    event: 'subscribe',
                    channel: 'ticker',
                    symbol: symbol
                }));
            }
            break;
    }
}
// S U B S C R I B E  C O I N  P A I R S



// H A N D L E  I N C O M I N G  M E S S A G E S
var orderbook = {};
let chanId = []

function handle(data, market) {

    const random = Math.floor(Math.random() * 200)

    if (market == "Huobi") {
        let symbol = data.ch.split('.')[1];
        let channel = data.ch.split('.')[2];
        switch (channel) {
            case 'kline':
                console.log('kline', data.tick);
                break;
            case 'trade':
                //console.log(`HUOBI ${symbol} random: ` + random + " --- " + JSON.stringify(data.tick.data[0].price));
                coins[symbol.toUpperCase()] = { ...coins[symbol.toUpperCase()], name: symbol.toUpperCase(), priceHuobi: parseFloat(data.tick.data[0].price) }
                break;
        }
    }
    else if (market == "FTX") {
        const channel = data.channel;
        const type = data.type
        let symbol
        switch (type) {
            case "subscribed":
                console.log("Subscribed successfully to FTX market")
                break;
            case 'update':
                if (channel == 'trades' && data.data && data.market) {
                    symbol = data.market.replace(/[/]/g, "");
                    //console.log(`FTX ${symbol} random: ` + random + " --- " + JSON.stringify(data.data[0].price));
                    coins[symbol.toUpperCase()] = { ...coins[symbol.toUpperCase()], name: symbol.toUpperCase(), priceFTX: parseFloat(data.data[0].price) }
                }
                break;
        }
    }
    else if (market == "Binance") {
        //CLIENT A COINI GONDER
        const channel = data.e
        switch (channel) {
            case "trade":
                if (data.s && data.p) {
                    coins[data.s] = { ...coins[data.s], name: data.s, priceBinance: parseFloat(data.p) }
                }
                break;
        }
    }
    else if (market == "BitFinex") {
        //CLIENT A COINI GONDER
        //console.log("handle a gelen" + JSON.stringify(data))
        let event = data.event
        if (data[1] === "hb") {
            event = "hb"
        }

        if (data.chanId && data.pair) {

            chanId[data.chanId] = data.pair
        }
        switch (event) {
            case "info":
                console.log("INFO: SERVERID : " + data.serverId)
                break;
            case "hb":
                console.log("HEARTBEAT RECEIVED")
                break;
            case "subscribed":
                const pair = data.pair
                console.log("Subscribed to : " + pair)
                break;
            default:

                //[149955,[1871.1,279.30292276,1871.2,685.30684485,48.4,0.0266,1870.8,25005.8819297,1920,1803.29468901]]
                //[CHANID, [.........LASTTRADEPRICE, VOLUME, HIGH, LOW]]
                if (data[0] && data[1][6] !== 'undefined') {

                    //console.log("price for " + symbol + " is " + lastPrice)
                    coins[chanId[data[0]]] = { ...coins[chanId[data[0]]], name: chanId[data[0]], priceBitFinex: parseFloat(data[1][6]) }
                } else if (data[1][6] === 'undefined') {
                    //onsole.log("undefined price received!!!!!!")
                    //onsole.log("undefined data: " + data)
                }
                break;
        }
    }
    else if (market == "Kucoin") {

        if (data.topic && data.subject) {
            let symbol = data.topic.split(':')[1];
            // TUM COINLERE SUBSCRIBE OLURSAN:   const coinName = JSON.parse(JSON.stringify(data.subject).replace(/[-]/g, ""))
            //TEK COINE SUBSCRIBE OLURSAN    :   const coinName = JSON.parse(JSON.stringify(symbol).replace(/[-]/g, ""))
            const coinName = JSON.parse(JSON.stringify(symbol).replace(/[-]/g, ""))
            const coinPrice = data.data.price
            //console.log(`Kucoin ${coinName} ` + " --- " + JSON.stringify(coinPrice));
            coins[coinName.toUpperCase()] = { ...coins[coinName.toUpperCase()], name: coinName.toUpperCase(), priceKucoin: parseFloat(coinPrice) }
        }
    }

    //CLIENT A COINI GONDER
    if (random > 100) {
        CheckAndSendCoins(coins)
    }

}
// H A N D L E  I N C O M I N G  M E S S A G E S


// R E A R R A N G E  C O I N  L I S T  A N D  P R E P A R E  F O R  S E N D I N G
const CheckAndSendCoins = (coins) => {
    try {
        console.log("coinslerim: " + JSON.stringify(coins))
        for (var key in coins) {
            const checkPercentageArray = [
                coins[key].priceKucoin,
                coins[key].priceBinance,
                coins[key].priceFTX,
                coins[key].priceHuobi,
                coins[key].priceBitFinex,
            ]

            if (checkPercentageArray.filter(Boolean).length >= 2) {
                const maxCoin = Math.max(
                    isNaN(coins[key].priceBinance) ? -Infinity : coins[key].priceBinance,
                    isNaN(coins[key].priceFTX) ? -Infinity : coins[key].priceFTX,
                    isNaN(coins[key].priceKucoin) ? -Infinity : coins[key].priceKucoin,
                    isNaN(coins[key].priceHuobi) ? -Infinity : coins[key].priceHuobi,
                    isNaN(coins[key].priceBitFinex) ? -Infinity : coins[key].priceBitFinex)

                const minCoin = Math.min(
                    isNaN(coins[key].priceBinance) ? Infinity : coins[key].priceBinance,
                    isNaN(coins[key].priceFTX) ? Infinity : coins[key].priceFTX,
                    isNaN(coins[key].priceKucoin) ? Infinity : coins[key].priceKucoin,
                    isNaN(coins[key].priceHuobi) ? Infinity : coins[key].priceHuobi,
                    isNaN(coins[key].priceBitFinex) ? Infinity : coins[key].priceBitFinex)

                const percentageWin = maxCoin * 100 / minCoin - 100

                coins[key].percentageWin = Math.abs(percentageWin).toFixed(2)

                if (Math.abs(percentageWin).toFixed(2) > 60 || Math.abs(percentageWin).toFixed(2) < 0.01) {
                    delete coins[key]
                } else {
                    if (!isNaN(coins[key].priceBinance)) {
                        coins[key].priceBinance = parseFloat(coins[key].priceBinance).toFixed(10)
                    }
                    if (!isNaN(coins[key].priceFTX)) {
                        coins[key].priceFTX = parseFloat(coins[key].priceFTX).toFixed(10)
                    }
                    if (!isNaN(coins[key].priceKucoin)) {
                        coins[key].priceKucoin = parseFloat(coins[key].priceKucoin).toFixed(10)
                    }
                    if (!isNaN(coins[key].priceHuobi)) {
                        coins[key].priceHuobi = parseFloat(coins[key].priceHuobi).toFixed(10)
                    }
                    if (!isNaN(coins[key].priceBitFinex)) {
                        coins[key].priceBitFinex = parseFloat(coins[key].priceBitFinex).toFixed(10)
                    }
                }
            } else {
                delete coins[key]
            }
        }

        coins = SortFullCoinList(coins)
        io.sockets.emit("message", coins);
    } catch (error) {
        console.log("error oldu", error)
    }
}

//sort desc
const SortFullCoinList = obj => {

    const arr = Object.keys(obj).map(el => {
        return obj[el]
    })
    arr.sort((a, b) => {
        return b.percentageWin - a.percentageWin;
    })
    return arr
}
//sort desc

// R E A R R A N G E  C O I N  L I S T  A N D  P R E P A R E  F O R  S E N D I N G

const RunInits = () => {
    init("Binance")     //https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams
    init("FTX")         //https://docs.ftx.com/#mark-support-messages-read
    init("Huobi")       //https://huobiapi.github.io/docs/spot/v1/en/#change-log
    init("Kucoin")      //https://docs.kucoin.com/#service-status
    init("BitFinex")    //https://docs.bitfinex.com/docs/ws-general //https://docs.bitfinex.com/reference/rest-public-platform-status#rest-public-conf
}

export {server, RunInits}