// Imports
const authenticateToken = require('../middlewares/authenticateToken')
const mMessage = require('../models/MMessage')
const resp = require('../utils/responses')

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const createMessage = async (req, res) => {
  try {

    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)
    
    const { to, text } = req.body

    const message = new mMessage({
      text,
      users: [
        auth.id,
        to
      ],
      sender: auth.id
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

    const auth = await authenticateToken(req, res)
    if (!auth) return resp.makeResponse400(res, 'Unauthorized user.', 'Unauthorized', 401)

    const { to } = req.body

    const messages = await mMessage.find({
      users: {
        $all: [auth.id, to]
      },
    }).sort({
      updatedAt: 1
    })

    const protectMessages = messages.map(msg => {
      return {
        fromSelf: msg?.sender?.toString() === auth.id,
        message: msg?.text,
        time: msg?.updatedAt
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
