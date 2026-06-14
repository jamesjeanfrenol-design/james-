import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
// Ne pas utiliser express.json et express.urlencoded pour les routes avec Multer
// Multer gère le parsing du FormData
// Ces middlewares peuvent interférer avec Multer
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StockMaster API is running' });
});

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('\n❌ Error during database initialization:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  MySQL connection refused. Please check:');
      console.error('   1. Is MySQL running in XAMPP? (Start MySQL from XAMPP Control Panel)');
      console.error('   2. Is MySQL listening on port 3306?');
      console.error(`   3. Connection details: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
      console.error(`   4. Database: ${process.env.DB_NAME || 'stockmaster'}`);
      console.error(`   5. User: ${process.env.DB_USER || 'root'}`);
      console.error('\n💡 Make sure to:');
      console.error('   - Start MySQL in XAMPP Control Panel');
      console.error('   - Create the database if it doesn\'t exist:');
      console.error('     mysql -u root -e "CREATE DATABASE IF NOT EXISTS stockmaster;"');
      console.error('   - Check your .env file configuration\n');
    } else {
      console.error('Error details:', error);
    }
    
    process.exit(1);
  });

export default app;

