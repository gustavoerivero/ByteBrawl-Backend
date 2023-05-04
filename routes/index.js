'use strict'

const router = require('express').Router()

router.use('/user', require('./RUser'))
router.use('/message', require('./RMessage'))

module.exports = router