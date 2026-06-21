const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const leaseRoutes = require('./routes/leaseRoutes');
const billingRoutes = require('./routes/billingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const caretakerRoutes = require('./routes/caretakerRoutes');
const landlordRouter = require('./routes/landlordRoutes');
const adminRouter = require('./routes/adminRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const financeRoutes = require('./routes/financeRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔥 DYNAMIC CORS FILTER: Robust parsing for local environments and changing cloud instances
const dynamicOriginCheck = (origin, callback) => {
    if (!origin) return callback(null, true); // Allows Postman, mobile apps, or direct server hits

    const isLocal = origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+/.test(origin);

    // Dynamic pattern matching to allow any production deployment or staging link from your frontend app
    const isProductionFrontend =
        (origin.includes('disciplined-truth-production') && origin.endsWith('.up.railway.app'));

    if (isLocal || isProductionFrontend) {
        callback(null, true);
    } else {
        console.warn(`[CORS REJECTED] Source Origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    }
};

// 2. MIDDLEWARE (Security & Parsers)
app.use(helmet());
app.use(cors({
    origin: dynamicOriginCheck,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[REQUEST RECEIVED] ${req.method} ${req.url}`);
    next();
});

// 3. SOCKET.IO INITIALIZATION (Shares the same dynamic origin rules)
const io = new Server(server, {
    cors: {
        origin: dynamicOriginCheck,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware to attach IO to the request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    socket.on('joinRoom', (conversationId) => {
        socket.join(conversationId);
        console.log(`[SOCKET] User ${socket.id} joined room: ${conversationId}`);
    });

    socket.on('leaveRoom', (conversationId) => {
        socket.leave(conversationId);
        console.log(`[SOCKET] User ${socket.id} left room: ${conversationId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});

// 4. RATE LIMITING & STATIC FILES
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);
app.use('/uploads', express.static('uploads'));

// 5. API ROUTE GATEWAYS
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/leases', leaseRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/caretaker', caretakerRoutes);
app.use('/api/v1/admin/invites', inviteRoutes);
app.use('/api/v1/landlord', landlordRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin-dashboard', adminDashboardRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/utilities', utilityRoutes);
app.use('/api/v1/tenant', tenantRoutes);

// 6. HEALTH CHECK
app.get('/', (req, res) => {
    res.status(200).json({ status: 'Success', message: 'Rent Management System API Gateway is Active.' });
});

// Global error handling middleware to cleanly catch CORS blockages
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ status: 'Fail', message: 'CORS policy blocked access.' });
    }
    next(err);
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`[SERVER] Security layer activated. Running on port ${PORT}...`);
    console.log(`[CORS] Live and local applications both successfully trusted.`);
});