const express = require('express')
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const { SECRET_KEY } = require('../config')
const authRoute = express.Router()

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
authRoute.post('/login', async (req, res, next) => {
	try {
		const { username, password } = req.body
		if (!username || !password) throw new ExpressError('Username/Password required', 400)
		const result = await User.authenticate(username, password)
		const token = jwt.sign({ username }, SECRET_KEY)
		const timeStamp = User.updateLoginTimestamp(req.body.username)
		return res.json({ token })
	} catch (err) {
		return next(err)
	}
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

authRoute.post('/register', async (req, res, next) => {
	try {
		const { username, password, first_name, last_name, phone } = req.body
		if (!username || !password) throw new ExpressError('Username/Password required', 400)

		const result = await User.register(username, password, first_name, last_name, phone)
		const token = jwt.sign({ username }, SECRET_KEY)
		const timeStamp = User.updateLoginTimestamp(username)

		return res.json({ token })
		// return res.json({ result })
	} catch (err) {
		if (err.code === '23505')
			return next(
				new ExpressError(`Username ${req.body.username} taken, please pick another!`, 400)
			)
		return next(err)
	}
})

module.exports = authRoute
