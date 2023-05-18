const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OTPSchema = Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    minlength: [1, 'Email must be at least 1 character'],
    maxlength: [255, 'Email must be less than 255 characters'],
    unique: [true, 'Email must be unique']
  },
  otp: {
    type: String,
    require: [true, 'The OTP code is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expired At date is required'],
  },
  deletedAt: {
    type: Date,
    required: false,
    default: null,
  }
}, { timestamps: true })

module.exports = mongoose.model('MOTP', OTPSchema)