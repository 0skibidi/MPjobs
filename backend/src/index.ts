import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { config } from './config/config';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import userRoutes from './routes/user.routes';
import { initModels } from './models'; // Import the model initializer

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB().then(() => {
  console.log('Database connected successfully');
  
  // Initialize all models
  initModels();
  
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow the configured CORS origin
    if (origin === config.corsOrigin) {
      return callback(null, true);
    }
    
    console.warn(`CORS rejected request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log more details about the error
  console.error('SERVER ERROR DETAILS:');
  console.error(`URL: ${req.method} ${req.originalUrl}`);
  console.error(`Request body:`, req.body);
  console.error(`Error message: ${err.message}`);
  console.error(`Stack trace: ${err.stack}`);
  
  res.status(500).json({
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

// Simplified server startup with explicit host binding
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`For local access, use: http://localhost:${PORT}`);
});

// Comment out the old dynamic port selection code
// const DEFAULT_PORT = parseInt(process.env.PORT || '5003');
// let currentPort = DEFAULT_PORT;
// const MAX_PORT_ATTEMPTS = 10;

// // Function to start server with port conflict handling
// const startServer = (port: number, attempt = 1) => {
//   const server = http.createServer(app);
  
//   server.on('error', (e: any) => {
//     if (e.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
//       console.log(`Port ${port} is in use, trying port ${port + 1}...`);
//       server.close();
//       startServer(port + 1, attempt + 1);
//     } else {
//       console.error('Server error:', e);
//       process.exit(1);
//     }
//   });
  
//   server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
//     if (port !== DEFAULT_PORT) {
//       console.log(`Note: Using alternative port. Update client config if needed.`);
//     }
//   });
// };

// // Start the server with automatic port conflict resolution
// startServer(currentPort); 