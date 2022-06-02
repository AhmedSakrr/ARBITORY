import { StatusCodes } from 'http-status-codes'
import UserModel from '../models/User.js'
import AppError from '../utils/appError.js';






//Oluşan hatayı errorhandler a gönderebilmek için next içerisine errorü koy ondan sonra orada bakalım demek
//express async error import ettiğimiz için next kullanmaya gerek yok.


const createSendToken = (user, statusCode, res) => {

  const token = user.createJWT()
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      name: user.name
    },
    token,
  })
};


const register = async (req, res, next) => {

  const { name, password, email } = req.body
  if (!name || !email || !password) {
    throw new AppError('Please provide all values', StatusCodes.BAD_REQUEST)
  }

  const user = await UserModel.create({ name, email, password })
  createSendToken(user, StatusCodes.CREATED, res)

}

const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw new AppError('Please provide all values', StatusCodes.BAD_REQUEST)
  }
  const user = await UserModel.findOne({ email }).select('+password')

  if (!user) {
    throw new AppError('Invalid Credentials', StatusCodes.UNAUTHORIZED)
  }
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new AppError('Invalid Credentials', StatusCodes.UNAUTHORIZED)
  }
  user.password = undefined
  createSendToken(user, StatusCodes.OK, res)
}

const updateUser = async (req, res) => {
  const { email, name, lastName } = req.body
  if (!email || !name || !lastName ) {
    throw new AppError('Please provide all values', StatusCodes.BAD_REQUEST)
  }

  const user = await UserModel.findOne({ _id: req.user.userId })
  user.email = email
  user.name = name
  user.lastName = lastName

  await user.save()

  res.status(StatusCodes.OK).json({
    user
  })
}

export { register, login, updateUser }