const jwt = require('jsonwebtoken')
require('dotenv').config()

const getTokenValues = async ({ token }) => {
  try {

    if (!token) return false

    const decode = await jwt.verify(token, process.env.SECRET_KEY)
    return decode

  } catch (error) {
    console.log('Token error: ', error)
    return false
  }

}

module.exports = getTokenValues