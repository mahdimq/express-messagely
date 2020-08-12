const express = require('express')
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')
const userRoute = express.Router()

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
userRoute.get('/', async (req, res, next) => {
	try {
		const result = await User.all()
		return res.json({ users: result })
	} catch (err) {
		return next(err)
	}
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
userRoute.get(
	'/:username',
	ensureLoggedIn,
	authenticateJWT,
	ensureCorrectUser,
	async (req, res, next) => {
		try {
			const { username } = req.params
			const result = await User.get(username)
			return res.json({ user: result })
		} catch (err) {
			return next(new ExpressError('Username not found', 404))
		}
	}
)

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
userRoute.get('/:username/to', ensureCorrectUser, ensureLoggedIn, async (req, res, next) => {
	try {
		const { username } = req.params
		const result = await User.get(username)
		return res.json({ messages: result })
	} catch (err) {
		return next(new ExpressError('Username not found', 404))
	}
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
userRoute.get('/:username/from', ensureCorrectUser, ensureLoggedIn, async (req, res, next) => {
	try {
		const { username } = req.params
		const result = await User.messagesFrom(username)
		return res.json({ messages: result })
	} catch (err) {
		return next(err)
	}
})

module.exports = userRoute
