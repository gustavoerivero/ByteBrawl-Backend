const router = require('express').Router()
const cUser = require('../controllers/CUser')

router.post('/create', cUser.createUser)
router.post('/login', cUser.login)
router.post('/restore', cUser.changePassword)
router.get('/profile', cUser.getProfile)
router.get('/', cUser.getAllUsers)
router.get('/:id', cUser.getUser)
router.put('/', cUser.updateUser)
router.patch('/avatar', cUser.updateAvatar)
router.delete('/', cUser.deleteUser)

module.exports = router