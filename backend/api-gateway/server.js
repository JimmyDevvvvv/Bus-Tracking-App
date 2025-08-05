import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Service discovery and routing
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    routes: ['/api/auth']
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    routes: ['/api/users', '/api/admin/users', '/api/student', '/api/driver']
  },
  bus: {
    url: process.env.BUS_SERVICE_URL || 'http://bus-service:3003',
    routes: ['/api/buses', '/api/bus']
  },
  location: {
    url: process.env.LOCATION_SERVICE_URL || 'http://location-service:3004',
    routes: ['/api/location', '/api/tracking']
  },
  chat: {
    url: process.env.CHAT_SERVICE_URL || 'http://chat-service:3005',
    routes: ['/api/chat', '/api/messages']
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
    routes: ['/api/notifications', '/api/announcements']
  },
  file: {
    url: process.env.FILE_SERVICE_URL || 'http://file-service:3007',
    routes: ['/api/files', '/api/upload', '/uploads']
  }
};

// Create proxy middleware for each service
Object.entries(services).forEach(([serviceName, service]) => {
  service.routes.forEach(route => {
    const proxy = createProxyMiddleware({
      target: service.url,
      changeOrigin: true,
      pathRewrite: {
        [`^${route}`]: route.replace('/api', '')
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add user info to headers for downstream services
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${serviceName}:`, err.message);
        res.status(503).json({
          success: false,
          message: `${serviceName} service is temporarily unavailable`
        });
      }
    });

    // Apply authentication middleware to protected routes
    if (route !== '/api/auth') {
      app.use(route, verifyToken, proxy);
    } else {
      app.use(route, proxy);
    }
  });
});

// WebSocket proxy for real-time features
app.get('/socket.io/*', (req, res) => {
  // Redirect WebSocket connections to location service
  res.redirect(307, `${process.env.LOCATION_SERVICE_URL || 'http://location-service:3004'}${req.url}`);
});

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bus Tracking System API Gateway',
    version: '1.0.0',
    services: Object.keys(services)
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Available services:', Object.keys(services));
}); 