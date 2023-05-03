const jwt = require('jsonwebtoken')
require('dotenv').config()

const authenticateToken = async(req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return false

    const decode = await jwt.verify(token, process.env.SECRET_KEY)
    return decode

  } catch (error) {
    console.log('Authenticated token error: ', error)
    return false
  }

}

module.exports = authenticateToken