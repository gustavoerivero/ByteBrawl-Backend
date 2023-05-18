const nodemailer = require('nodemailer')

require('dotenv').config()

const user = process.env.EMAIL_USER.toString()
const pass = process.env.EMAIL_PASS.toString()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user,
    pass
  },
  tls: {
    rejectUnauthorized: false
  }
})

const sendEmail = async (email, subject = '', content = '') => {
  try {
    const message = {
      from: `"BItE brAwL Support" <${user}>`,
      to: email,
      subject: subject,
      html: content
    }

    const resp = await transporter.sendMail(message)
    return resp

  } catch (error) {
    
    console.log('Send email error: ', error)
    return error
  }
}

module.exports = sendEmail