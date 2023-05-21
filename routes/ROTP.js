const router = require('express').Router()
const cOTP = require('../controllers/COTP')

router.post('/', cOTP.createOTP)
router.post('/verify', cOTP.verifyOTP)
router.post('/email', cOTP.sendEmailVerification)
router.post('/email-verification', cOTP.verificationEmail)

module.exports = router