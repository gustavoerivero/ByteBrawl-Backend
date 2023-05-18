const router = require('express').Router()
const cOTP = require('../controllers/COTP')

router.post('/', cOTP.createOTP)

module.exports = router