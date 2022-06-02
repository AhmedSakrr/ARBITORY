
import {StatusCodes} from 'http-status-codes'
import AppError from '../utils/appError.js'


const errorHandlerMiddleware = (err, req, res, next) => {
    
    err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    err.status = err.status || 'error'


    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {

        let error
        if(err.name === "CastError") error = handleCastErrorDB(err)
        if(err.code && err.code === 11000) error = handleDuplicateFieldsDB(err)
        if(err.name === "ValidationError") error = handleValidationErrorDB(err)
        if(err.name === "JsonWebTokenError") error = handleJWTErrorDB(err)
        if(err.name === "TokenExpiredError") error = handleJWTTokenExpiredError(err)
        sendErrorProd(error, res)
    }
    next()
}



const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, StatusCodes.BAD_REQUEST)
}
const handleDuplicateFieldsDB = err => {
    const value = err.err.message.match(/(["'])(\\?.)*?\1/)[0]
    const message = `Duplicated field value: ${value}. Please use another value!`
    return new AppError(message, StatusCodes.BAD_REQUEST)
}
const handleValidationErrorDB = err => {
    const message = Object.values(err.errors).map((item) => item.message).join(', ')
    return new AppError(message, StatusCodes.BAD_REQUEST)
}
const handleJWTErrorDB = err => new AppError("Invalid token. Please login again", StatusCodes.BAD_REQUEST)
const handleJWTTokenExpiredError = err => new AppError("Token expired. Please login again", StatusCodes.BAD_REQUEST)

const sendErrorDev = (err, res) =>{
    res.status(err.statusCode).json({
        status: err.status,
        //error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err, res) =>{

    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    }else{

        console.error('ERROR !!!', err)

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}


export default errorHandlerMiddleware