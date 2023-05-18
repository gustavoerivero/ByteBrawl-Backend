const generateOTP = async () => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    return otp
  } catch (error) {
    throw new Error('It was not possible to generate an OTP.')
  }
}

module.exports = generateOTP