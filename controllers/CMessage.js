// Imports
const mMessage = require('../models/MMessage')
const resp = require('../utils/responses')

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const createMessage = async (req, res) => {
  try {
    
    const { from, to, text } = req.body

    const message = new mMessage({
      text: text,
      users: [
        from,
        to
      ],
      sender: from
    })

    const response = await message.save()

    resp.makeResponsesOkData(res, response, 'MCreated')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const getAllMessages = async (req, res) => {
  try {
    const { from, to } = req.body

    const messages = await mMessage.find({
      users: {
        $all: [from, to]
      },
    }).sort({
      updatedAt: 1
    })

    const protectMessages = messages.map(msg => {
      return {
        fromSelf: msg?.sender?.toString() === from,
        message: msg?.text
      }
    })

    resp.makeResponsesOkData(res, protectMessages, 'Success')

  } catch (error) {
    resp.makeResponsesError(res, error, 'UnexpectedError')
  }
}

module.exports = {
  createMessage,
  getAllMessages
}
