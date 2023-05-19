const bcrypt = require('bcryptjs')

const comparePassword = (pass, encrypt) => {
  return bcrypt.compare(pass, encrypt)
}

const verifyHash = (unhashed, hashed) => {
  return bcrypt.compare(unhashed, hashed)
}

module.exports = {
  comparePassword,
  verifyHash
}