import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });


export default {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  salt: process.env.SALT,

  jwt: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '1h',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '7d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '10d',
  },

  email: {
    expires: parseInt(process.env.EMAIL_EXPIRES || String(15 * 60 * 1000)),
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    address: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    admin: process.env.ADMIN_EMAIL,
  },

  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  limit: {
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_DELAY: process.env.RATE_LIMIT_DELAY,
  }
};