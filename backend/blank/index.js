"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const models_1 = require("./models");
const http_1 = __importDefault(require("http"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, database_1.connectDB)().then(() => {
    console.log('Database connected successfully');
    (0, models_1.initModels)();
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            /^http:\/\/localhost:5\d{3}$/,
            /^http:\/\/localhost:3\d{3}$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
            'http://localhost:5010',
            'http://localhost:5174',
            'https://example.com',
        ];
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            }
            else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        if (isAllowed) {
            console.log(`CORS allowed for origin: ${origin}`);
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use((err, req, res, next) => {
    console.error('SERVER ERROR DETAILS:');
    console.error(`URL: ${req.method} ${req.originalUrl}`);
    console.error(`Request body:`, req.body);
    console.error(`Error message: ${err.message}`);
    console.error(`Stack trace: ${err.stack}`);
    res.status(500).json({
        message: err.message || 'Something went wrong!'
    });
});
const DEFAULT_PORT = parseInt(process.env.PORT || '5002');
let currentPort = DEFAULT_PORT;
const MAX_PORT_ATTEMPTS = 10;
const startServer = (port, attempt = 1) => {
    const server = http_1.default.createServer(app);
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
            console.log(`Port ${port} is in use, trying port ${port + 1}...`);
            server.close();
            startServer(port + 1, attempt + 1);
        }
        else {
            console.error('Server error:', e);
            process.exit(1);
        }
    });
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        if (port !== DEFAULT_PORT) {
            console.log(`Note: Using alternative port. Update client config if needed.`);
        }
    });
};
startServer(currentPort);
//# sourceMappingURL=index.js.map