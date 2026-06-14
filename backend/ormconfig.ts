import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stockmaster',
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, 'src/models/**/*.ts')],
  migrations: [path.join(__dirname, 'database/migrations/**/*.ts')],
  subscribers: [],
});

