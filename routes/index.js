'use strict'

const router = require('express').Router()

router.use('/user', require('./RUser'))

module.exports = router