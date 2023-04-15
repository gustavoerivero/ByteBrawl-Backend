const bcrypt = require('bcryptjs')

const comparePassword = (pass, encrypt) => {
  return bcrypt.compare(pass, encrypt)
}

module.exports = {
  comparePassword
}