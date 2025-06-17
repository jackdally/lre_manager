module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lre_manager',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development_secret',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
}; 