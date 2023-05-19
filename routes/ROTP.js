const router = require('express').Router()
const cOTP = require('../controllers/COTP')

router.post('/', cOTP.createOTP)
router.post('/verify', cOTP.verifyOTP)

module.exports = router