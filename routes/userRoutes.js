
import {register, login, updateUser } from "../controllers/userController.js";
import express from 'express'
import authenticateUser from "../middleware/authenticate.js";

const router = express.Router()

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/updateUser').patch(authenticateUser, updateUser)

export default router