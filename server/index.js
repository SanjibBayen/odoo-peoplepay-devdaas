import app from './src/app.js';
import { pool } from './src/config/database.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test database connection
  const isConnected = await pool.connect();
//   pool.release();
  
  if (!isConnected) {
    console.error(' Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
};

startServer();