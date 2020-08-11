/** User class for message.ly */
const ExpressError = require('../expressError')
const bcrypt = require('bcrypt')
const db = require('../db')
/** User of the site. */

const { BCRYPT_WORK_FACTOR } = require('../config')

let current_timestamp = new Date()

class User {
	constructor(username, first_name, last_name, phone) {
		this.username = username
		this.first_name = first_name
		this.last_name = last_name
		this.phone = phone
	}
	/** register new user -- returns
	 *    {username, password, first_name, last_name, phone}
	 */

	static async register({ username, password, first_name, last_name, phone }) {
		// Hash Password
		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
		console.log('HASHED PASSWORD', hashedPassword)
		// Save to DB
		const result = await db.query(
			`INSERT INTO users (username, password, first_name, last_name, phone, join_at)
       VALUES ($1, $2, $3, $4, $5, current_timestamp)
       RETURNING username, first_name, last_name, join_at`,
			[username, hashedPassword, first_name, last_name, phone]
		)
		console.log(username, hashedPassword, first_name, last_name, phone)
		return result.rows[0]
	}

	/** Authenticate: is this username/password valid? Returns boolean. */

	static async authenticate(username, password) {
		const result = await db.query(`SELECT username, password FROM users WHERE username = $1`, [
			username
		])
		if (!result.rows[0]) false
		const pw = bcrypt.compare(password, result.rows[0].password)
		return pw
	}

	/** Update last_login_at for user */

	static async updateLoginTimestamp(username) {
		if (!username) throw new ExpressError('Username not found!', 400)
		const result = db.query(
			`UPDATE users SET last_login_at = $1 WHERE username = $2 RETURNING username, last_login_at`,
			[current_timestamp, username]
		)
		return result.rows[0]
	}

	/** All: basic info on all users:
	 * [{username, first_name, last_name, phone}, ...] */

	static async all() {
		const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`)
		const user = result.rows.map((u) => new User(u.username, u.first_name, u.last_name, u.phone))
		return user
	}

	/** Get: get user by username
	 *
	 * returns {username,
	 *          first_name,
	 *          last_name,
	 *          phone,
	 *          join_at,
	 *          last_login_at } */

	static async get(username) {
		const result = await db.query(
			`SELECT username, first_name, last_name, phone, join_at, last_login_at WHERE username = $1`,
			[username]
		)
		const user = result.rows[0]
		if (!user) throw new ExpressError(`User with username: ${username} does not exist`, 404)
		return user
	}

	/** Return messages from this user.
	 *
	 * [{id, to_user, body, sent_at, read_at}]
	 *
	 * where to_user is
	 *   {username, first_name, last_name, phone}
	 */

	static async messagesFrom(username) {
		const result = await db.query(
			`SELECT msg.id, msg.to_username, msg.body, msg.sent_at, msg.read_at, u.username, u.first_name, u.last_name, u.phone
       FROM messages AS msg
       JOIN users AS u
       ON msg.to_username = u.username
       WHERE msg.from_username = $1`,
			[username]
		)
		if (!username) throw new ExpressError(`Username of ${username} not found`, 404)
		return result.rows[0]
	}

	/** Return messages to this user.
	 *
	 * [{id, from_user, body, sent_at, read_at}]
	 *
	 * where from_user is
	 *   {id, first_name, last_name, phone}
	 */

	static async messagesTo(username) {}
}

module.exports = User
