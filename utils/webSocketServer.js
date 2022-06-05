//import webSocket from './utils/webSocket.js'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import axios from 'axios'
import { config } from 'process';

const appSocket = express();
const server = createServer(appSocket);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

//EMPTY OBJECT
let FullCoinList = new Object()

io.on('connection', socket => {
  console.log('connection made successfully')

  //KULLANICI BAGLANDIĞINDA BIR DATA GONDER
  io.sockets.emit("message", FullCoinList);

  socket.on('message', payload => {
    console.log('Message received on server: ', payload)
    if (payload.message == 'TriggerFetching') {
      FetchCoinListsFromMarkets()
    }
    //io.emit('message',payload)
  })

  socket.on("disconnect", (reason) => {
    console.log('disconnection made successfully')
  });
})

setTimeout(() => {
  FetchCoinListsFromMarkets()
}, 60000);

function FetchCoinListsFromMarkets() {
  console.log("DATA is fetching")

  const data1 = axios.get('https://api3.binance.com/api/v3/ticker/24hr')
  const data2 = axios.get('https://ftx.com/api/markets')
  const data3 = axios.get('https://www.kucoin.com/_api/trade-front/market/getSymbol/all')
  const data4 = axios.get('https://api-pub.bitfinex.com/v2/tickers?symbols=ALL')

  Promise.all([data1, data2, data3, data4])
    .then(files => {

      console.log("Datas fetched!")

      FullCoinList = new Object()
      try {
        //BINANCE MARKET
        const modifiedBinance = files[0].data

        //FTX MARKET
        const JSONftx = files[1].data.result
        const modifiedFTX = JSON.parse(JSON.stringify(JSONftx).replace(/[/]/g, ""))
        const finalFTX = modifiedFTX.filter((a) => !a.name.includes("-"))

        //KUCOIN MARKET
        const JSONKucoin = files[2].data.data
        const modifiedKucoin = JSON.parse(JSON.stringify(JSONKucoin).replace(/[-]/g, ""))

        //BITFINEX MARKET
        const JSONBitFinex = files[3].data
        const modifiedBitFinex = JSON.parse(JSON.stringify(JSONBitFinex).replace(/[:]/g, ""))

        try {
          modifiedBinance.forEach(coin => {
            if (coin.count > 400) {
              FullCoinList[coin.symbol] = { ...FullCoinList[coin.symbol], name: coin.symbol, priceBinance: parseFloat(coin.lastPrice) }
            }else{
              FullCoinList[coin.symbol] = { ...FullCoinList[coin.symbol], name: coin.symbol, banned: "YES" }
            }
          })

          finalFTX.forEach(coin => {
            FullCoinList[coin.name] = { ...FullCoinList[coin.name], name: coin.name, priceFTX: parseFloat(coin.last) }
          })

          modifiedKucoin.forEach(coin => {
            FullCoinList[coin.symbol] = { ...FullCoinList[coin.symbol], name: coin.symbol, priceKucoin: parseFloat(coin.lastTradedPrice) }
          })

          modifiedBitFinex.forEach(coin => {
            FullCoinList[coin[0].substring(1)] = { ...FullCoinList[coin[0].substring(1)], name: coin[0].substring(1), priceBitFinex: parseFloat(coin[1]) }
          })

        } catch (error) {
          console.log(error)
        }
        for (var key in FullCoinList) {
          const checkPercentageArray = [
            FullCoinList[key].priceKucoin,
            FullCoinList[key].priceBinance,
            FullCoinList[key].priceFTX,
            FullCoinList[key].priceBitFinex
          ]

          if (checkPercentageArray.filter(Boolean).length >= 2) {
            const maxCoin = Math.max(
              isNaN(FullCoinList[key].priceBinance) ? -Infinity : FullCoinList[key].priceBinance,
              isNaN(FullCoinList[key].priceFTX) ? -Infinity : FullCoinList[key].priceFTX,
              isNaN(FullCoinList[key].priceKucoin) ? -Infinity : FullCoinList[key].priceKucoin,
              isNaN(FullCoinList[key].priceBitFinex) ? -Infinity : FullCoinList[key].priceBitFinex)

            const minCoin = Math.min(
              isNaN(FullCoinList[key].priceBinance) ? Infinity : FullCoinList[key].priceBinance,
              isNaN(FullCoinList[key].priceFTX) ? Infinity : FullCoinList[key].priceFTX,
              isNaN(FullCoinList[key].priceKucoin) ? Infinity : FullCoinList[key].priceKucoin,
              isNaN(FullCoinList[key].priceBitFinex) ? Infinity : FullCoinList[key].priceBitFinex)

            const percentageWin = maxCoin * 100 / minCoin - 100

            FullCoinList[key].percentageWin = Math.abs(percentageWin).toFixed(2)
            if (Math.abs(percentageWin).toFixed(2) > 40 || Math.abs(percentageWin).toFixed(2) < 0.5) {
              //delete FullCoinList[key]
            } else {
              if (!isNaN(FullCoinList[key].priceBinance)) {
                FullCoinList[key].priceBinance = FullCoinList[key].priceBinance.toFixed(10)
              }
              if (!isNaN(FullCoinList[key].priceFTX)) {
                FullCoinList[key].priceFTX = FullCoinList[key].priceFTX.toFixed(10)
              }
              if (!isNaN(FullCoinList[key].priceKucoin)) {
                FullCoinList[key].priceKucoin = FullCoinList[key].priceKucoin.toFixed(10)
              }
              if (!isNaN(FullCoinList[key].priceBitFinex)) {
                FullCoinList[key].priceBitFinex = FullCoinList[key].priceBitFinex.toFixed(10)
              }
            }
          } else {
            delete FullCoinList[key]
          }
        }
        io.sockets.emit("message", FullCoinList);

      } catch (error) {
        console.log("Error oldu:" + error)
      }


    })
    .catch(err => { })
}

export default server