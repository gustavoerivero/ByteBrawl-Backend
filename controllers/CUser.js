// Imports
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const generator = require('generate-password')

const mUser = require('../models/MUser')
const resp = require('../utils/responses')
const validate = require('../utils/validate')

require('dotenv').config()

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const createUser = async (req, res) => {
  try {

    const value = req.body

    if (await mUser.findOne({
      email: value.email,
      status: 'A'
    })) {

      resp.makeResponsesError(res, 'User exist.', 'UFound')

    } else if (await mUser.findOne({
      email: value.email,
      status: 'I'
    })) {

      const saveUser = await mUser.findOneAndUpdate({ email: value.email }, {
        $set: {
          status: 'A',
          deletedAt: null
        }
      })

      resp.makeResponsesOkData(res, saveUser, 'Success')

    } else {

      const user = new mUser({
        fullName: value.fullName,
        username: value.username,
        email: value.email,
        password: bcrypt.hashSync(value.password),
      })

      await user.save()
      resp.makeResponsesOkData(res, {
        fullName: value.fullName,
        username: value.username,
        email: value.email
      }, 'UCreated')

    }

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const login = async (req, res) => {
  try {

    const valUser = await mUser.findOne({
      email: req.body.email
    })

    if (!valUser) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'ULoginError1')
    }

    const valPass = await validate.comparePassword(req.body.password, valUser.password)

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
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const getAllUsers = async (req, res) => {
  try {

    const users = await mUser.paginate({
      status: 'A'
    }, {
      page: req.params.page || 1,
      limit: req.params.limit || 10,
      sort: { createdAt: -1 }
    })

    resp.makeResponsesOkData(res, users, 'Success')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const getUser = async (req, res) => {
  try {
    const user = await mUser.findOne({
      _id: req.params.id,
      status: 'A'
    })
      .sort({ createdAt: -1 })

    resp.makeResponsesOkData(res, user, 'Success')
  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const changePassword = async (req, res) => {
  try {

    const valUser = await mUser.findOne({
      _id: req.params.id,
      email: req.body.email,
      status: 'A'
    })

    if (!valUser) {
      return resp.makeResponsesError(res, `User don't exist`, 'UNotFound')
    }

    const valPass = await validate.comparePassword(req.body.password, valUser.password)

    if (!valPass) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'UChangePasswordError')
    }

    const valNewPass = await validate.comparePassword(req.body.newPassword, valUser.password)

    if (valNewPass) {
      return resp.makeResponsesError(res, 'Incorrect credentials', 'UChangePasswordError1')
    }

    const saveUser = await mUser.findOneAndUpdate({
      _id: valUser._id,
      status: 'A'
    }, {
      $set: {
        password: bcrypt.hashSync(req.body.newPassword)
      }
    })

    resp.makeResponsesOkData(res, saveUser, 'UChangePasswordSuccess')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const deleteUser = async (req, res) => {
  try {
    const user = await mUser.findOne({ _id: req.params.id, status: 'A' })

    if (!user) {
      return resp.makeResponsesError(res, `User don't exist`, 'UNotFound')
    }

    const saveUser = await user.updateOne({
      _id: req.params.id,
      status: 'I'
    }, {
      $set: {
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
  deleteUser
}