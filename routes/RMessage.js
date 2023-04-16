const router = require('express').Router()
const cMessage = require('../controllers/CMessage')

router.post('/create', cMessage.createMessage)
router.post('/all', cMessage.getAllMessages)

module.exports = router