// Imports
const bcrypt = require('bcryptjs')

const mOTP = require('../models/MOTP')
const generateOTP = require('../utils/generateOTP')
const resp = require('../utils/responses')
const sendEmail = require('../services/mailer')
const OTPTemplate = require('../services/assets/OTPTemplate')

const createOTP = async (req, res) => {
  try {

    const { email, duration } = req.body

    if (!email) {
      resp.makeResponsesError(res,
        new Error('Provide values for email.'),
        'UnexpectedError'
      )
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

module.exports = {
  createOTP
}
