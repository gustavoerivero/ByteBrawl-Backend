const mongoose = require('mongoose')
require('dotenv').config()

const user = process.env.DB_USER
const pass = process.env.DB_PASS
const uri = process.env.DB_URI

const connection = `mongodb+srv://${user}:${pass}@${uri}`

mongoose
  .connect(connection)
  .then(() => {
    console.log(`Database connected.`)
  })
  .catch(err => {
    console.error(err)
    console.log(`Unable to connect the database.`)
  })