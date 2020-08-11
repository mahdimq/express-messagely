const express = require('express')
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const { SECRET_KEY } = require('../config')
const authRoute = express.Router()

// Check if routing is working
authRoute.get('/', (req, res, next) => {
	res.send('ROUTING IS WORKING!')
})

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
		const timeStamp = User.updateLoginTimestamp(username)
		return res.json({ message: 'Logged In!', token })
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
		const result = await User.register(username)
		const token = jwt.sign({ username }, SECRET_KEY)
		const timeStamp = User.updateLoginTimestamp(username)
		console.log(username, password, first_name, last_name, phone)
		return res.json({ message: 'Registered!', token })
	} catch (err) {
		return next(err)
		// return next(new ExpressError('All inputs required!', 400))
	}
})

module.exports = authRoute
