// Dependencies
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const swaggerDocs = require('./services/swagger')
const routes = require('./routes')

require('dotenv').config()
require('./db/db')

// Swagger
const swaggerUi = require('swagger-ui-express')
const authenticateToken = require('./middlewares/authenticateToken')

// Settings
const port = process.env.PORT || 8000
const app = express()

// Middlewares
app.use(express.json())
app.use(morgan('tiny'))
app.use(express.urlencoded({ extended: false }))

app.use(cors())

app.use(`${process.env.API_DOC}`, swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Routes
const url = process.env.URL + process.env.URL_API + process.env.URL_VERSION

app.use(url, routes)

// Start server
app.get(process.env.URL, (_, res) => res.send('Connected!'))
app.get(url, (_, res) =>
  res.send(`Connected on ByteBrawl API ${process.env.VERSION} version!`)
)

// Check user authorized
app.get(`${url}/auth`, (req, res) => {
  try {
    const auth = Boolean(authenticateToken(req, res))
    if (!auth?.id) {
      res.send({ Authenticated: false })
      return
    }

    res.send({ Authenticated: true  })

  } catch (error) {
    res.send({ Authenticated: false, error: error })
  }
})

// Listening server
app.listen(port, () => console.log(`API is running on the port ${port}`))
