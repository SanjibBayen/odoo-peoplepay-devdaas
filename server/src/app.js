import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const { testDatabaseConnection } = await import('./config/database.js');
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      res.json({ success: true, message: 'Database connected' });
    } else {
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default app;