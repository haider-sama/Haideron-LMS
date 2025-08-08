import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw Error(`Missing Environment variable for ${key}`);
  }

  return value;
};

export const NODE_ENV = getEnv("NODE_ENV", "development");
export const PORT = getEnv("PORT", "4004");
export const DATABASE_URL = getEnv("DATABASE_URL");
export const FRONTEND_URL = getEnv("FRONTEND_URL");
export const JWT_SECRET = getEnv("JWT_SECRET_KEY");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const GLOBAL_EMAIL_DOMAIN = getEnv("GLOBAL_EMAIL_DOMAIN");
export const CLOUDINARY_CLOUD_NAME = getEnv("CLOUDINARY_CLOUD_NAME");
export const CLOUDINARY_API_KEY = getEnv("CLOUDINARY_API_KEY");
export const CLOUDINARY_API_SECRET = getEnv("CLOUDINARY_API_SECRET");
export const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID");
export const GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET");
export const EMAIL_USER = getEnv("EMAIL_USER");
export const EMAIL_PASS = getEnv("EMAIL_PASS");
export const FIREBASE_STORAGE_BUCKET = getEnv("FIREBASE_STORAGE_BUCKET");

export const REDIS_HOSTNAME = getEnv("REDIS_HOSTNAME");
export const REDIS_PASS = getEnv("REDIS_PASS");
export const REDIS_USERNAME = getEnv("REDIS_USERNAME");
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 11378;

export const ALLOW_EMAIL_MIGRATION = getEnv("ALLOW_EMAIL_MIGRATION");
export const ALLOW_PUBLIC_REGISTRATION = getEnv("ALLOW_PUBLIC_REGISTRATION");