'use strict'

const router = require('express').Router()

router.use('/user', require('./RUser'))
router.use('/message', require('./RMessage'))
router.use('/otp', require('./ROTP'))

module.exports = router