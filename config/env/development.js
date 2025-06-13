module.exports = {
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'lre_manager',
    password: process.env.POSTGRES_PASSWORD || 'development',
    database: process.env.POSTGRES_DB || 'lre_manager',
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