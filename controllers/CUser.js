// Imports
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const mUser = require('../models/MUser')
const mOTP = require('../models/MOTP')

const resp = require('../utils/responses')
const validate = require('../utils/validate')
const authenticateToken = require('../middlewares/authenticateToken')
const generator = require('../utils/password-generator')
const sendEmail = require('../services/mailer')
const template = require('../services/assets/passwordResetTemplate')
const generateOTP = require('../utils/generateOTP')
const OTPTemplate = require('../services/assets/OTPTemplate')
const recoverTemplate = require('../services/assets/recoverTemplate')

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

    if (!email) {
      return resp.makeResponsesError(
        res,
        'Provide values for email.',
        'UnexpectedError'
      )
    }

    const generatedOTP = await generateOTP()

    const otp = new mOTP({
      email,
      otp: bcrypt.hashSync(generatedOTP),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 * 24
    })

    await mOTP.deleteOne({ email })
    await otp.save()

    const sendedEmail = await sendEmail(
      email,
      `Email verification. - BItE brAwL`,
      OTPTemplate(
        generatedOTP,
        24,
        process.env.EMAIL_USER.toString(),
        'Verify your email with the code below'
      )
    )

    console.log(sendedEmail && 'Email sended')

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

    if (!valUser.verified) {
      return resp.makeResponsesError(res, 'User is not verified', 'UnexpectedError')
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

    const { search, page, limit } = req.query

    const searchQuery = {}
    if (search && search.trim() !== '') {
      searchQuery.username = { $regex: search.trim(), $options: 'i' }
    }

    const users = await mUser.paginate({
      status: 'A',
      _id: { $ne: auth.id },
      ...searchQuery
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

const restorePassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await mUser.findOne({ email, status: 'A' })

    if (!user) {
      return resp.makeResponsesError(res, `User don't exist.`, 'UNotFound')
    }

    const password = generator(12)

    const updateUser = await mUser.findOneAndUpdate({
      email,
      status: 'A'
    }, {
      $set: {
        password: bcrypt.hashSync(password)
      }
    })

    const supportEmail = process.env.EMAIL_USER.toString()

    const sendedEmail = await sendEmail(email, 'Recover your account!', template(password, supportEmail))

    console.log(sendedEmail && 'Email sended')

    resp.makeResponsesOkData(res, updateUser, 'UChangePasswordSuccess')

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

const sendToken = async (req, res) => {
  try {

    const { email } = req.body

    if (!email) {
      return resp.makeResponsesError(
        res,
        'An email is required',
        'UnexpectedError'
      )
    }

    const user = await mUser.findOne({ email, status: 'A' })

    if (!user) {
      return resp.makeResponsesError(
        res,
        `There's no account for the provided email`,
        'UnexpectedError'
      )
    }

    if (!user.verified) {
      return resp.makeResponsesError(
        res,
        `Email hasn't been verified yet. Check your inbox.`,
        'UnexpectedError'
      )
    }

    const generatedOTP = await generateOTP()

    const otp = new mOTP({
      email,
      otp: bcrypt.hashSync(generatedOTP),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    })

    await mOTP.deleteOne({ email })
    await otp.save()

    const secret = process.env.SECRET_KEY
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        otp: generatedOTP
      },
      secret,
      { expiresIn: '1h' })
    const recoverUrl = `${process.env.DEV_URL}${token}`

    const sendedEmail = await sendEmail(
      email,
      `Recover your password - BItE brAwL`,
      recoverTemplate(
        recoverUrl,
        'Recover your account access',
        1,
        process.env.EMAIL_USER.toString(),
        'Click on the link to update your password.'
      )
    )

    console.log(sendedEmail && 'Email sended')

    return resp.makeResponsesOkData(res, { response: 'Email sended' }, 'Success')

  } catch (error) {
    return resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const passwordReset = async (req, res) => {
  try {

    const { email } = req.body

    if (!email) {
      return resp.makeResponsesError(
        res,
        'An email is required',
        'UnexpectedError'
      )
    }

    const user = await mUser.findOne({ email, status: 'A' })

    if (!user) {
      return resp.makeResponsesError(
        res,
        `There's no account for the provided email`,
        'UnexpectedError'
      )
    }

    if (!user.verified) {
      return resp.makeResponsesError(
        res,
        `Email hasn't been verified yet. Check your inbox.`,
        'UnexpectedError'
      )
    }

    const generatedOTP = await generateOTP()

    const otp = new mOTP({
      email,
      otp: bcrypt.hashSync(generatedOTP),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    })

    await mOTP.deleteOne({ email })
    await otp.save()

    const sendedEmail = await sendEmail(
      email,
      `Password Reset - BItE brAwL`,
      OTPTemplate(
        generatedOTP,
        1,
        process.env.EMAIL_USER.toString(),
        'Enter the code below to reset your password.'
      )
    )

    console.log(sendedEmail && 'Email sended')

    resp.makeResponsesOkData(
      res,
      otp,
      'Success'
    )

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const passwordRenewed = async (req, res) => {
  try {

    const { email, otp, newPassword } = req.body

    if (!(email && otp && newPassword)) {
      return resp.makeResponsesError(
        res,
        'Empty credentials are not allowed.',
        'UnexpectedError'
      )
    }

    const matchedOTPRecord = await mOTP.findOne({ email })

    if (!matchedOTPRecord) {
      return resp.makeResponsesError(
        res,
        'No OTP records found.',
        'UnexpectedError'
      )
    }

    const { expiresAt } = matchedOTPRecord

    if (expiresAt < Date.now()) {
      await mOTP.deleteOne({ email })
      return resp.makeResponsesError(
        res,
        'Code has expired. Request for a new one.',
        'UnexpectedError'
      )
    }

    const hashedOTP = matchedOTPRecord.otp
    const validOTP = await verifyHash(otp, hashedOTP)

    if (!validOTP) {
      return resp.makeResponsesError(
        res,
        'Invalid code passed. Check your inbox.',
        'UnexpectedError'
      )
    }

    const response = await mUser.findOneAndUpdate(
      { email }, {
      $set: {
        password: bcrypt.hashSync(newPassword)
      }
    })

    await mOTP.deleteOne({ email })

    return resp.makeResponsesOkData(res, response, 'Success')

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
  deleteUser,
  restorePassword,
  passwordReset,
  passwordRenewed,

  sendToken
}