import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import { sequelize } from './src/config/database.js';
import { initializeDatabase } from './src/models/index.js';
import { initSocket } from './src/services/socket.service.js';

dotenv.config();

// ============ STARTUP ENVIRONMENT VALIDATION ============
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in all values.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Initialize models
    await initializeDatabase();
    
    // Create HTTP server & attach Socket.IO
    const server = http.createServer(app);
    initSocket(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

startServer();