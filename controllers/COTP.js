// Imports
const bcrypt = require('bcryptjs')

const mOTP = require('../models/MOTP')
const mUser = require('../models/MUser')

const generateOTP = require('../utils/generateOTP')
const resp = require('../utils/responses')
const sendEmail = require('../services/mailer')
const OTPTemplate = require('../services/assets/OTPTemplate')
const { verifyHash } = require('../utils/validate')

require('dotenv').config()

const createOTP = async (req, res) => {
  try {

    const { email, duration } = req.body

    if (!email) {
      return resp.makeResponsesError(res,
        'Provide values for email.',
        'UnexpectedError'
      )
    }

    await mOTP.deleteOne({ email })

    const generatedOTP = await generateOTP()

    const otp = new mOTP({
      email,
      otp: bcrypt.hashSync(generatedOTP),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 * duration
    })

    const response = await otp.save()

    const sendedEmail = await sendEmail(
      email,
      `Hey! Here is the OTP Code. - BItE brAwL`,
      OTPTemplate(
        generatedOTP,
        duration,
        process.env.EMAIL_USER.toString()
      )
    )

    console.log(sendedEmail && 'Email sended')

    resp.makeResponsesOkData(res, response, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const verifyOTP = async (req, res) => {
  try {

    const { email, otp } = req.body

    if (!(email && otp)) {
      return resp.makeResponsesError(
        res,
        'Provide values for email and OTP.',
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

    resp.makeResponsesOkData(res, { email: matchedOTPRecord.email, valid: Boolean(validOTP) }, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return resp.makeResponsesError(
        res,
        'Provide values for email.',
        'UnexpectedError'
      )
    }

    const user = await mUser.findOne({ email })

    if (!user) {
      return resp.makeResponsesError(
        res,
        `There's no account for the provided email.`,
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
    const response = await otp.save()

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

    resp.makeResponsesOkData(res, response, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const verificationEmail = async (req, res) => {
  try {

    const { email, otp } = req.body

    if (!(email && otp)) {
      resp.makeResponsesError(
        res,
        'Empty otp details are not allowed.',
        'UnexpectedError'
      )
      return
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

    await mOTP.deleteOne({ email })

    const response = await mUser.findOneAndUpdate({
      email
    }, {
      $set: {
        verified: true
      }
    })

    resp.makeResponsesOkData(
      res,
      response,
      'Success'
    )

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

module.exports = {
  createOTP,
  verifyOTP,
  sendEmailVerification,
  verificationEmail
}
