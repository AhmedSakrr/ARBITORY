
import cookieParser from 'cookie-parser'
import AppError from '../utils/appError.js'
import jwt from "jsonwebtoken";
import { StatusCodes } from 'http-status-codes';

  const authenticate = async (req, res, next) => {
    // check header
    //const token = req.cookies.jwt
    const authHeader = req.headers.authorization

    if ( !authHeader ) {
      throw new AppError('Authentication invalid', StatusCodes.UNAUTHORIZED)
    }
    const tokenFromHeader = authHeader.split(' ')[1]
    
    console.log("Req.headers: " + tokenFromHeader)
    try {
      const payload = jwt.verify(tokenFromHeader, process.env.JWT_SECRET)
      console.log("UserId: " + payload.userId)
      req.user = { userId: payload.userId }
      next()
    } catch (error) {
      throw new AppError('Authentication invalid', StatusCodes.UNAUTHORIZED)
    }
  }
export default authenticate