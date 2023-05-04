// Imports
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const mUser = require('../models/MUser')
const resp = require('../utils/responses')
const validate = require('../utils/validate')
const authenticateToken = require('../middlewares/authenticateToken')

require('dotenv').config()

/**
 * Creates a new user in the database.
 *
 * @param {Request} req - The request object containing the user's information.
 * @param {Response} res - The response object to send the result back to the client.
 */
const createUser = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body

    const existingUser = await mUser.findOne({ email })

    if (existingUser && existingUser.status === 'A') {
      resp.makeResponsesError(res, 'User already exists', 'UFound')
      return
    }

    if (existingUser && existingUser.status === 'I') {
      await mUser.findOneAndUpdate({ email }, {
        $set: { status: 'A', deletedAt: null }
      })

      resp.makeResponsesOkData(res, { fullName, username, email }, 'UReactivated')
      return
    }

    const user = new mUser({
      fullName,
      username,
      email,
      password: bcrypt.hashSync(password),
    })

    await user.save()

    resp.makeResponsesOkData(res, { fullName, username, email }, 'UCreated')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Authenticates a user by their username and password, and generates a token for the user.
 * 
 * @param {Request} req - HTTP request object
 * @param {Response} res - HTTP response object
 */
const login = async (req, res) => {
  try {

    const { username, password } = req.body

    const valUser = await mUser.findOne({ username })

    if (!valUser) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'ULoginError1')
    }

    const valPass = await validate.comparePassword(password, valUser.password)

    if (!valPass) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'ULoginError2')
    }

    const secret = process.env.SECRET_KEY
    const token = jwt.sign({ id: valUser._id, }, secret, { expiresIn: '1w' })

    const user = {
      id: valUser._id,
      token: token
    }

    resp.makeResponsesOkData(res, user, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Retrieves a list of active users.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
const getAllUsers = async (req, res) => {
  try {

    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const { page, limit } = req.params

    const users = await mUser.paginate({
      status: 'A'
    }, {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
      select: '_id avatarImage isAvatarImageSet fullName username email status'
    })

    resp.makeResponsesOkData(res, users, 'Success')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Retrieves the data of a single user from the database, given its id.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
const getUser = async (req, res) => {
  try {

    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const { id } = req.params

    const user = await mUser.findOne({
      _id: id,
      status: 'A'
    })
      .select('-_id avatarImage isAvatarImageSet fullName username email status ')

    resp.makeResponsesOkData(res, user, 'Success')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Retrieves the authenticated user's profile information.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
const getProfile = async (req, res) => {
  try {

    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const user = await mUser.findOne({
      _id: auth.id,
      status: 'A'
    })
      .select('-_id avatarImage isAvatarImageSet fullName username email status')

    resp.makeResponsesOkData(res, user, 'Success')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Update a user's information such as their `username`, `email`, and `fullName`.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
const updateUser = async (req, res) => {
  try {
    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const { username, email, fullName } = req.body

    const saveUser = await mUser.findOneAndUpdate({
      _id: auth.id,
      status: 'A'
    }, {
      $set: {
        username,
        fullName,
        email
      }
    })

    resp.makeResponsesOkData(res, saveUser, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const updateAvatar = async (req, res) => {
  try {
    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const { avatar } = req.body

    await mUser.findOneAndUpdate({
      _id: auth.id,
      status: 'A'
    }, {
      $set: {
        avatarImage: avatar,
        isAvatarImageSet: true
      }
    })

    const user = await mUser.findOne({
      _id: auth.id,
      status: 'A'
    })
      .select('-_id avatarImage isAvatarImageSet username status')

    resp.makeResponsesOkData(res, user, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Changes the password of a user.
 *
 * @param {Request} req - The HTTP request.
 * @param {Response} res - The HTTP response.
 */
const changePassword = async (req, res) => {
  try {

    const { email, password, newPassword } = req.body

    const valUser = await mUser.findOne({
      email,
      status: 'A'
    })

    if (!valUser) {
      return resp.makeResponsesError(res, `User don't exist`, 'UNotFound')
    }

    const valPass = await validate.comparePassword(password, valUser.password)

    if (!valPass) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'UChangePasswordError')
    }

    const valNewPass = await validate.comparePassword(newPassword, valUser.password)

    if (valNewPass) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'UChangePasswordError1')
    }

    const saveUser = await mUser.findOneAndUpdate({
      _id: valUser._id,
      status: 'A'
    }, {
      $set: {
        password: bcrypt.hashSync(newPassword)
      }
    })

    resp.makeResponsesOkData(res, saveUser, 'UChangePasswordSuccess')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * Deletes a user from the database.
 *
 * @param {Request} req - The request object containing the user's authentication token.
 * @param {Response} res - The response object to send the result back to the client.
 */
const deleteUser = async (req, res) => {
  try {

    const auth = await authenticateToken(req, res)

    if (!auth) {
      makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)
      return
    }

    const user = await mUser.findOne({ _id: auth.id, status: 'A' })

    if (!user) {
      makeResponsesError(res, `User doesn't exist`, 'UNotFound')
      return
    }

    const saveUser = await user.updateOne({
      _id: auth.id
    }, {
      $set: {
        status: 'I',
        deletedAt: Date.now()
      }
    })

    resp.makeResponsesOkData(res, saveUser, 'UDeleted')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

module.exports = {
  createUser,
  login,
  changePassword,
  getAllUsers,
  getUser,
  getProfile,
  updateUser,
  updateAvatar,
  deleteUser
}