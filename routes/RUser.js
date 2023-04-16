const router = require('express').Router()
const cUser = require('../controllers/CUser')

router.post('/create', cUser.createUser)
router.post('/login', cUser.login)
router.post('/:id/password', cUser.changePassword)
router.get('/', cUser.getAllUsers)
router.get('/:id', cUser.getUser)
router.delete('/:id', cUser.deleteUser)

module.exports = router