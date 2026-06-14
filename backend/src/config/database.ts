import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockmaster',
  synchronize: false, // Ne jamais utiliser en production
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../models/**/*.ts'],
  migrations: [__dirname + '/../../database/migrations/**/*.ts'],
  subscribers: [],
  // Support pour les connexions SSL (nécessaire pour certains hébergeurs)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

