import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// CORS configuration
// app.use(cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check
app.get('/api/health', async(req, res) => {
    try {
        const { sequelize } = await
        import ('./config/database.js');
        await sequelize.authenticate();

        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Import routes
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import departmentRoutes from './routes/department.routes.js';
// import jobPositionRoutes from './routes/jobPosition.routes.js';
// import employeeTypeRoutes from './routes/employeeType.routes.js';
import contractRoutes from './routes/contract.routes.js';
// API routes

import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import departmentRoutes from './routes/department.routes.js';
import jobPositionRoutes from './routes/jobPosition.routes.js';
import employeeTypeRoutes from './routes/employeeType.routes.js';
import workScheduleRoutes from './routes/workSchedule.routes.js';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/job-positions', jobPositionRoutes);
app.use('/api/employee-types', employeeTypeRoutes);
app.use('/api/work-schedules', workScheduleRoutes);
app.use('/api/contracts', contractRoutes);


// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;