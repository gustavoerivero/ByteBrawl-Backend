const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const userSchema = Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    minlength: [1, 'Full name must be at least 1 character'],
    maxlength: [525, 'Full name must be less than 525 characters'],
  },
  username: {
    type: String,
    require: [true, 'Username is required'],
    minlength: [8, 'Username must be at least 8 characters'],
    maxlength: [20, 'Username must be less than 20 characters'],
    unique: [true, 'Username must be unique'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    minlength: [1, 'Email must be at least 1 character'],
    maxlength: [255, 'Email must be less than 255 characters'],
    unique: [true, 'Email must be unique'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [16, 'Password must be less than 16 characters'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    minlength: [1, 'Status must be at least 1 character'],
    maxlength: [1, 'Status must be at most 1 character'],
    enum: {
      values: ['A', 'I'], // A = Active, I = Inactive
      message: '{VALUE} is not a valid status',
    },
    default: 'A'
  },
  deletedAt: {
    type: Date,
    required: false,
    default: null,
  }
}, { timestamps: true })

userSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('MUser', userSchema)