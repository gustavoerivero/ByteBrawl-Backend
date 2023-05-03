const message = require('./messages.json')

function makeResponse400(res, error, code = 'Unauthorized', number = 404) {
  const msg = {
    OK: 0,
    Error: error,
    Message: message[[code || 'Unauthorized']]
  }
  res.status(number).json(msg)
}

function makeResponsesError(res, error, code) {
  const msg = {
    OK: 0,
    Error: error,
    Message: message[[code || 'UnexpectedError']]
  }
  res.status(404).json(msg)
}

function makeResponsesException(res, err) {
  const msg = {
    OK: 0,
    Message: err
  }
  res.status(404).json(msg)
}

function makeResponsesOk(res, code) {
  const msg = {
    OK: 1,
    Message: message[[code]] || 'Success'
  }
  res.status(200).json(msg)
}

function makeResponsesOkData(res, data, code) {
  const msg = {
    OK: 1,
    Data: data,
    Message: message[[code]] || 'Success'
  }
  res.status(200).json(msg)
}

module.exports = {
  makeResponsesException,
  makeResponsesOkData,
  makeResponsesError,
  makeResponsesOk,
  makeResponse400
}