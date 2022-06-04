//import webSocket from './utils/webSocket.js'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import axios from 'axios'

const appSocket = express();
const server = createServer(appSocket);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

//EMPTY OBJECT
let FullCoinList = []

io.on('connection', socket => {
  console.log('connection made successfully')

  //KULLANICI BAGLANDIĞINDA BIR DATA GONDER
  io.sockets.emit("message", FullCoinList);

  socket.on('message', payload => {
    console.log('Message received on server: ', payload)
    //io.emit('message',payload)
  })

  socket.on("disconnect", (reason) => {
    console.log('disconnection made successfully')
  });
})

// const getPriceBinance = async () => {
//   try {
//     axios.get('https://api3.binance.com/api/v3/ticker/price')
//       .then(function (response) {
//         // handle success
//         return response.data
//         //io.sockets.emit("message", response.data);
//       })
//   } catch (error) {
//     console.error(error)
//   }
// }

// const getPriceFTX = async () => {
//   try {
//     axios.get('https://ftx.com/api/markets')
//       .then(function (response) {
//         // handle success

//         //io.sockets.emit("message", response.data.result);
//         return response.data.result
//       })
//   } catch (error) {
//     console.error(error)
//   }
// }

// const getPriceFTX = async () => { return await axios.get('https://ftx.com/api/markets') }


setInterval(() => {


  const data1 = axios.get('https://ftx.com/api/markets')
  const data2 = axios.get('https://api3.binance.com/api/v3/ticker/price')

  Promise.all([data1, data2])
    // .then(files => {files.forEach(file => )})
    .then(files => {

      console.log("Datas fetched!")

      FullCoinList = []
      const coin = new Object()
      try {
        //BINANCE MARKET
        const modifiedBinance = files[1].data

        //FTX MARKET
        const JSONftx = files[0].data.result
        const modifiedFTX = JSON.parse(JSON.stringify(JSONftx).replace(/[/]/g, ""))
        const finalFTX = modifiedFTX.filter((a) => !a.name.includes("-"))

        try {
          modifiedBinance.forEach(object2 => {
              const coin = new Object()
              coin.name = object2.symbol
              coin.priceBinance = object2.price
              FullCoinList.push(coin)
          })


          finalFTX.forEach(obj => {
            const coin = new Object()
            coin.name = obj.name
            coin.priceFTX = obj.last
            FullCoinList.push(coin)
          })

          FullCoinList.forEach((obj,index) =>{
            FullCoinList.forEach((obj2, index2) =>{
              const coin = new Object()
              if(obj.name === obj2.name){
                coin.name = obj2.name
                if(obj2.priceFTX) coin.priceFTX = obj2.priceFTX
                if(obj2.priceBinance) coin.priceBinance = obj2.priceBinance
                if(obj.priceFTX) coin.priceFTX = obj.priceFTX
                if(obj.priceBinance) coin.priceBinance = obj.priceBinance
                FullCoinList[index] = coin
              }
            })
          })

        } catch (error) {
          console.log(error)
        }

        // modifiedBinance.filter((a) => {
        //   modifiedFTX.find((p) => {
        //     if(a.symbol === p.name){
        //       p.binancePrice = a.price
        //       FullCoinList.push(p)
        //     }
        //   })
        // })
        console.log("Datas:" + uniqueFullCoinList)
        io.sockets.emit("message", uniqueFullCoinList);

      } catch (error) {
        console.log("Error oldu:" + error)
      }


    })
    .catch(err => { })
}, 30000);

// setTimeout(() => {


//   const comparedList = getPriceFTX.filter((a) => {
//     return getPriceBinance.find((p) => p.symbol === a.name.replace("\"/\":", "\"\":"))
//   })
// }, 7000);

export default server