require('dotenv').config();
module.exports = {
    DATABASE_PATH: process.env.DATABASE_PATH || './database.sqlite',
    PORT: process.env.PORT || 3000,
    GEMINI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
};