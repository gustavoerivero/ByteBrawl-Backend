const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const messageSchema = Schema({
  text: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [1, 'Message must be at least 1 character'],
    maxlength: [10240, 'Message must be less than 10240 characters'],
  },
  users: {
    type: Array,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'MUser',
    required: [true, 'User ID is required'],
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

messageSchema.plugin(mongoosePaginate)
module.exports = mongoose.model('MMessage', messageSchema)