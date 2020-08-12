const express = require('express')
const { Message } = require('../models/message')
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')
const ExpressError = require('../expressError')

const msgRoute = new express.Router()

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
msgRoute.get('/:id', ensureLoggedIn, async (req, res, next) => {
	try {
		const { id } = req.params
		const { username } = req.user
		const result = await Message.get(id)
		if (result.from_user.username !== username || result.to_user.username !== username) {
			throw new ExpressError('Message cannot be read!', 401)
		}
		return res.json({ message: result })
	} catch (err) {
		return next(err)
	}
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
msgRoute.post('/', ensureLoggedIn, async (req, res, next) => {
	try {
		const { username, to_username, body } = req.user
		const result = await Message.create({
			from_username: username,
			to_username: to_username,
			body: body
		})
		return res.json({ message: result })
	} catch (err) {
		return next(err)
	}
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
msgRoute.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
	try {
		const { id } = req.params
		const result = await Message.get(id)
		if (result.to_user.username !== req.user.username)
			throw new ExpressError('Unauthorized to mark read', 401)
		const message = await Message.markRead(id)
		return res.json({ message })
	} catch (err) {
		return next(err)
	}
})

module.exports = msgRoute
