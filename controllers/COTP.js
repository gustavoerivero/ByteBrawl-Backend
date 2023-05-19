// Imports
const bcrypt = require('bcryptjs')

const mOTP = require('../models/MOTP')
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
      resp.makeResponsesError(res,
        'Provide values for email.',
        'UnexpectedError'
      )
      return
    }

    await mOTP.deleteOne({ email })

    const generatedOTP = await generateOTP()

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

    const otp = new mOTP({
      email,
      otp: bcrypt.hashSync(generatedOTP),
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 * duration
    })

    const response = await otp.save()

    resp.makeResponsesOkData(res, response, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

const verifyOTP = async (req, res) => {
  try {

    const { email, otp } = req.body

    if (!(email && otp)) {
      resp.makeResponsesError(
        res,
        'Provide values for email and OTP.',
        'UnexpectedError'
      )
      return
    }

    const matchedOTPRecord = await mOTP.findOne({ email })

    if (!matchedOTPRecord) {
      resp.makeResponsesError(
        res,
        'No OTP records found.',
        'UnexpectedError'
      )
      return
    }

    const { expiresAt } = matchedOTPRecord

    if (expiresAt < Date.now()) {
      await mOTP.deleteOne({ email })
      resp.makeResponsesError(
        res,
        'Code has expired. Request for a new one.',
        'UnexpectedError'
      )
      return
    }
 
    const hashedOTP = matchedOTPRecord.otp
    const validOTP = await verifyHash(otp, hashedOTP)

    resp.makeResponsesOkData(res, { email: matchedOTPRecord.email, valid: Boolean(validOTP) }, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

module.exports = {
  createOTP,
  verifyOTP
}
