const swaggerJsonDoc = require('swagger-jsdoc')

const swaggerOptions = {
  openapi: '3.0.0',
  definition: {
    info: {
      title: 'ByteBrawl API Documentation',
      version: '1.0.0',
      description: "ByteBawl is a video game based on the famous old minesweeper in which you will have to find a route that will lead you to victory. In this section, you will find the respective Swagger UI documentation to test the REST API that will be implemented for ByteBrawl.",
      contact: {
        name: 'ByteBrawl',
        email: 'gustavoerivero12@gmail.com',
      },
    },
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        scheme: 'bearer',
        in: 'header'
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./doc/*/*.yml', './doc/*/*/*.yml']
}

module.exports = swaggerJsonDoc(swaggerOptions)