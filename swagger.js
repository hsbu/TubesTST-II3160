const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Books API',
      version: '1.0.0',
      description: 'Express.js backend API for books data with Supabase and JWT authentication',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3211',
        description: 'Local Development Server',
      },
      {
        url: 'http://18223014.tesatepadang.space',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Book: {
          type: 'object',
          required: ['title', 'genres', 'authors', 'year'],
          properties: {
            id: {
              type: 'integer',
              description: 'Book ID (auto-generated)',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Book title',
              example: 'The Great Gatsby',
            },
            genres: {
              type: 'string',
              description: 'Book genres separated by comma',
              example: 'Fiction,Classic',
            },
            authors: {
              type: 'string',
              description: 'Book author name',
              example: 'F. Scott Fitzgerald',
            },
            year: {
              type: 'integer',
              description: 'Publication year',
              example: 1925,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'TidakTerautentikasi',
            },
            message: {
              type: 'string',
              example: 'Token tidak valid atau sudah kedaluwarsa.',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
