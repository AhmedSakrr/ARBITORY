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

const data3 = []

io.on('connection', socket => {
  console.log('connection made successfully')
  
  //KULLANICI BAGLANDIĞINDA BIR DATA GONDER
  socket.broadcast.emit('message',data3)

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
      try {
        const JSONOBJ = files[0].data.result
        const JSonModified = JSON.stringify(JSONOBJ).replace(/[/]/g, "");
        const JsONAgain = JSON.parse(JSonModified)
        JsONAgain.filter((a) => {
          files[1].data.find((p) => {
            if(p.symbol === a.name){
              a.binancePrice = p.price
              data3.push(a)
            }
          })
          
        })
        console.log("Datas:" + data3)
        io.sockets.emit("message", data3);
      } catch (error) {
        console.log("Error oldu:" + error) 
      }
  
  
    })
    .catch(err => { })  
}, 60000);

// setTimeout(() => {


//   const comparedList = getPriceFTX.filter((a) => {
//     return getPriceBinance.find((p) => p.symbol === a.name.replace("\"/\":", "\"\":"))
//   })
// }, 7000);

export default server