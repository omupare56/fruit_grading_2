import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[Security Warning] JWT_SECRET environment variable is not set. Using default — CHANGE THIS IN PRODUCTION.');
}
const JWT_SECRET_EFFECTIVE = JWT_SECRET || 'fruitvision_dl_super_secret_jwt_key_2026_change_in_production';

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer in-memory storage for uploaded fruit images
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Allowed: PNG, JPG, JPEG, WEBP.'));
    }
  },
});

// MongoDB Atlas Client Connection Reuse
let mongoClient: MongoClient | null = null;
let mongoConnected = false;

async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (mongoClient && mongoConnected) {
    return mongoClient.db('fruit_quality_db');
  }
  try {
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    await mongoClient.connect();
    mongoConnected = true;
    return mongoClient.db('fruit_quality_db');
  } catch (err) {
    mongoConnected = false;
    return null;
  }
}

// In-memory fallback for local dev when MONGODB_URI is not yet provided
const inMemoryUsers: Record<string, any> = {};
const inMemoryPredictions: any[] = [];

// Helper: Standard API Success Response
function apiSuccess(res: Response, data: any = {}, message: string = 'Success', status: number = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
}

// Helper: Standard API Error Response
function apiError(res: Response, code: string, message: string, status: number = 400) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// Auth Middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    institution?: string;
    role?: string;
  };
}

function isDemoMode(): boolean {
  // DEMO_MODE is explicitly opt-in. Defaults to FALSE for production safety.
  const envVal = process.env.REVIEW_DEMO_MODE || process.env.DEMO_MODE || 'false';
  return envVal.toLowerCase() === 'true' || envVal === '1';
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token === 'undefined' || token === 'null' || !token || token.trim() === '') {
    token = null;
  }

  if (!token) {
    return apiError(res, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_EFFECTIVE) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      name: decoded.name,
      institution: decoded.institution || 'B.Tech IT Department',
      role: decoded.role || 'Researcher',
    };
    next();
  } catch {
    return apiError(res, 'INVALID_TOKEN', 'Session has expired or is invalid. Please log in again.', 401);
  }
}

function authenticatePrediction(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token === 'undefined' || token === 'null' || !token || token.trim() === '') {
    token = null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_EFFECTIVE) as any;
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        institution: decoded.institution || 'B.Tech IT Department',
        role: decoded.role || 'Researcher',
      };
      return next();
    } catch {
      return apiError(res, 'INVALID_TOKEN', 'Session has expired or is invalid. Please log in again.', 401);
    }
  }

  if (!token) {
    // Guest / Demo Flow
    req.user = {
      id: 'demo_user',
      email: 'demo@fruitvision.com',
      name: 'Demo User',
      institution: 'Guest Demo',
      role: 'Guest',
    };
    return next();
  }

  return apiError(res, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.', 401);
}

function optionalOrDemoAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token === 'undefined' || token === 'null' || !token || token.trim() === '') {
    token = null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_EFFECTIVE) as any;
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        institution: decoded.institution || 'B.Tech IT Department',
        role: decoded.role || 'Researcher',
      };
      return next();
    } catch {
      // Token invalid — require auth
    }
  }

  return apiError(res, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.', 401);
}

// Model Configuration Inspectors
function getYoloStatus(): string {
  const customPath = process.env.YOLO_MODEL_PATH || 'models/yolo/best.pt';
  try {
    return fs.existsSync(customPath) && fs.statSync(customPath).size > 0 ? 'configured' : 'not_configured';
  } catch {
    return 'not_configured';
  }
}

function getEfficientNetStatus(): string {
  const customPath = process.env.EFFICIENTNET_MODEL_PATH || 'models/efficientnet/efficientnet_v2.pth';
  try {
    return fs.existsSync(customPath) && fs.statSync(customPath).size > 0 ? 'configured' : 'not_configured';
  } catch {
    return 'not_configured';
  }
}

// ==========================================
// REST API ROUTES (/api/*)
// ==========================================

// 1. GET /api/health
app.get('/api/health', async (req: Request, res: Response) => {
  const db = await getMongoDb();
  const dbStatus = db ? 'connected' : process.env.MONGODB_URI ? 'disconnected' : 'not_configured';

  return apiSuccess(res, {
    status: 'healthy',
    api: 'healthy',
    database: dbStatus,
    demo_mode: isDemoMode(),
    models: {
      yolo: getYoloStatus(),
      efficientnet_v2: getEfficientNetStatus(),
    },
    optional_modules: {
      defect_detection: 'not_configured',
      shelf_life_prediction: 'not_configured',
      market_grade: 'not_configured',
    },
    timestamp: new Date().toISOString(),
  }, 'FruitVision DL API is operational');
});

// 2. POST /api/auth/signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { name, email, password, institution } = req.body || {};

  if (!name || name.trim().length < 2) {
    return apiError(res, 'INVALID_NAME', 'Please provide a valid full name.', 422);
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return apiError(res, 'INVALID_EMAIL', 'Please provide a valid email address.', 422);
  }
  if (!password || password.length < 6) {
    return apiError(res, 'WEAK_PASSWORD', 'Password must be at least 6 characters long.', 422);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await getMongoDb();
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  if (db) {
    const existing = await db.collection('users').findOne({ email: normalizedEmail });
    if (existing) {
      return apiError(res, 'USER_EXISTS', 'An account with this email already exists.', 409);
    }
    await db.collection('users').insertOne({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      institution: institution || 'B.Tech IT Department',
      role: 'Researcher',
      created_at: new Date().toISOString(),
    });
  } else {
    if (inMemoryUsers[normalizedEmail]) {
      return apiError(res, 'USER_EXISTS', 'An account with this email already exists.', 409);
    }
    inMemoryUsers[normalizedEmail] = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      institution: institution || 'B.Tech IT Department',
      role: 'Researcher',
      created_at: new Date().toISOString(),
    };
  }

  const token = jwt.sign(
    { sub: userId, email: normalizedEmail, name: name.trim() },
    JWT_SECRET_EFFECTIVE,
    { expiresIn: '7d' }
  );

  return apiSuccess(res, {
    token,
    user: {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      institution: institution || 'B.Tech IT Department',
      role: 'Researcher',
    },
  }, 'Account created successfully.', 201);
});

// 3. POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return apiError(res, 'MISSING_CREDENTIALS', 'Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await getMongoDb();
  let userRecord: any = null;

  if (db) {
    userRecord = await db.collection('users').findOne({ email: normalizedEmail });
  } else {
    userRecord = inMemoryUsers[normalizedEmail];
  }

  if (!userRecord) {
    return apiError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, userRecord.password_hash);
  if (!isMatch) {
    return apiError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const token = jwt.sign(
    { sub: userRecord.id, email: userRecord.email, name: userRecord.name },
    JWT_SECRET_EFFECTIVE,
    { expiresIn: '7d' }
  );

  return apiSuccess(res, {
    token,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      institution: userRecord.institution || 'B.Tech IT Department',
      role: userRecord.role || 'Researcher',
    },
  }, 'Logged in successfully.');
});

// 4. POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  return apiSuccess(res, { logged_out: true }, 'Logged out successfully.');
});

// 5. GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return apiSuccess(res, { user: req.user }, 'User profile retrieved successfully.');
});

// 6. POST /api/upload (Image validation)
app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return apiError(res, 'MISSING_FILE', 'No image file provided under key "image".', 400);
  }

  const base64Data = req.file.buffer.toString('base64');
  const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

  return apiSuccess(res, {
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    preview_url: dataUrl,
  }, 'Image uploaded and validated successfully.');
});

// 7. POST /api/predict — proxies to Python ML microservice
app.post('/api/predict', authenticatePrediction, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return apiError(res, 'MISSING_FILE', 'No image file provided for analysis.', 400);
  }

  const pythonMlUrl = (process.env.PYTHON_ML_URL || '').replace(/\/+$/, '');

  if (!pythonMlUrl) {
    return apiError(
      res,
      'ML_BACKEND_NOT_CONFIGURED',
      'The ML inference backend is not configured. Set the PYTHON_ML_URL environment variable to point to your deployed Python Flask ML service (e.g., https://fruitvision-ml.railway.app). See README.md for deployment instructions.',
      503
    );
  }

  try {
    // Forward image + metadata to Python ML microservice
    const mlFormData = new FormData();
    const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    mlFormData.append('image', imageBlob, req.file.originalname || 'image.jpg');
    mlFormData.append('user_id', req.user?.id || 'anonymous');
    mlFormData.append('filename', req.file.originalname || 'image.jpg');

    if (req.body?.is_benchmark_test === 'true') {
      mlFormData.append('is_benchmark_test', 'true');
      if (req.body?.benchmark_data) {
        mlFormData.append('benchmark_data', req.body.benchmark_data);
      }
    }

    const mlResponse = await fetch(`${pythonMlUrl}/ml/predict`, {
      method: 'POST',
      headers: {
        'X-ML-Secret': process.env.ML_INTERNAL_SECRET || 'fruitvision-ml-internal-secret',
      },
      body: mlFormData,
      signal: AbortSignal.timeout(60000), // 60s timeout for ML inference
    });

    const contentType = mlResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await mlResponse.text();
      console.error('[ML Service Error] Non-JSON response:', text.substring(0, 300));
      return apiError(res, 'ML_BACKEND_ERROR', 'ML service returned an invalid response. Check PYTHON_ML_URL is correct and the service is healthy.', 502);
    }

    const mlResult: any = await mlResponse.json();

    if (!mlResponse.ok || !mlResult.success) {
      return res.status(mlResponse.status || 422).json({
        success: false,
        error: {
          code: mlResult.error?.code || 'ML_INFERENCE_ERROR',
          message: mlResult.error?.message || mlResult.message || `ML service error (status ${mlResponse.status})`,
        },
      });
    }

    const mlData = mlResult.data;
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const base64Img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const detections = mlData.detections || [];

    const record = {
      prediction_id: predictionId,
      user_id: req.user?.id || 'anonymous',
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      filename: req.file.originalname || 'image.jpg',
      image_url: base64Img,
      preview_url: base64Img,
      fruit_count: mlData.fruit_count || detections.length,
      detections,
      fruits: detections,
      results: detections,
      mode: 'production',
      is_demo: false,
      image_metadata: mlData.image_metadata || {},
      model_information: mlData.model_information || {},
    };

    // Persist to MongoDB Atlas or in-memory
    const db = await getMongoDb();
    if (db) {
      try {
        await db.collection('predictions').insertOne({ ...record });
      } catch (e) {
        console.error('[MongoDB Save Error]', e);
      }
    } else {
      inMemoryPredictions.unshift(record);
    }

    return res.status(200).json({
      success: true,
      mode: 'production',
      message: `Analyzed ${record.fruit_count} fruits successfully.`,
      data: record,
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return apiError(res, 'ML_TIMEOUT', 'ML inference timed out (>60s). The model may still be loading — try again in a moment.', 504);
    }
    console.error('[ML Proxy Error]', err);
    return apiError(
      res,
      'ML_BACKEND_UNREACHABLE',
      `Could not reach ML inference backend at ${process.env.PYTHON_ML_URL}: ${err.message}`,
      502
    );
  }
});

// 8. GET /api/predictions
app.get('/api/predictions', optionalOrDemoAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const db = await getMongoDb();

  let predictionsList: any[] = [];
  if (db) {
    predictionsList = await db
      .collection('predictions')
      .find({ user_id: userId }, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
  } else {
    predictionsList = inMemoryPredictions.filter((p) => p.user_id === userId);
  }

  return apiSuccess(res, {
    predictions: predictionsList,
    count: predictionsList.length,
  }, `Retrieved ${predictionsList.length} prediction records.`);
});

// 9. GET /api/predictions/:prediction_id
app.get('/api/predictions/:id', optionalOrDemoAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const predId = req.params.id;
  const db = await getMongoDb();

  let record: any = null;
  if (db) {
    record = await db.collection('predictions').findOne({ prediction_id: predId, user_id: userId }, { projection: { _id: 0 } });
  } else {
    record = inMemoryPredictions.find((p) => p.prediction_id === predId && p.user_id === userId);
  }

  if (!record) {
    return apiError(res, 'NOT_FOUND', `Prediction with ID '${predId}' was not found.`, 404);
  }

  return apiSuccess(res, record, 'Prediction retrieved successfully.');
});

// 10. DELETE /api/predictions/:prediction_id
app.delete('/api/predictions/:id', optionalOrDemoAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const predId = req.params.id;
  const db = await getMongoDb();

  if (db) {
    const result = await db.collection('predictions').deleteOne({ prediction_id: predId, user_id: userId });
    if (result.deletedCount === 0) {
      return apiError(res, 'NOT_FOUND', 'Prediction not found or already deleted.', 404);
    }
  } else {
    const idx = inMemoryPredictions.findIndex((p) => p.prediction_id === predId && p.user_id === userId);
    if (idx === -1) {
      return apiError(res, 'NOT_FOUND', 'Prediction not found or already deleted.', 404);
    }
    inMemoryPredictions.splice(idx, 1);
  }

  return apiSuccess(res, { deleted_id: predId }, 'Prediction deleted successfully.');
});

// 11. GET /api/stats
app.get('/api/stats', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  let userId: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
      userId = decoded.sub || decoded.id;
    } catch { }
  }

  const db = await getMongoDb();
  let records: any[] = [];

  if (db) {
    const query = userId ? { user_id: userId } : {};
    records = await db.collection('predictions').find(query, { projection: { _id: 0 } }).sort({ timestamp: -1 }).toArray();
  } else {
    records = userId ? inMemoryPredictions.filter((p) => p.user_id === userId) : inMemoryPredictions;
  }

  if (records.length === 0) {
    if (isDemoMode()) {
      return apiSuccess(res, {
        total_analyses: 3,
        total_fruits_detected: 8,
        average_quality_confidence: 'Demo Value',
        fruit_distribution: {
          Apple: 3,
          Banana: 3,
          Orange: 2,
        },
        quality_distribution: {
          Good: 5,
          Moderate: 3,
          Excellent: 0,
          Fair: 0,
          Poor: 0,
        },
        recent_analyses: [
          {
            prediction_id: 'pred_demo_01',
            filename: 'mixed_fruits_sample_1.jpg',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            fruit_count: 3,
            is_demo: true,
          },
          {
            prediction_id: 'pred_demo_02',
            filename: 'apple_orchard_batch.jpg',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            fruit_count: 2,
            is_demo: true,
          },
          {
            prediction_id: 'pred_demo_03',
            filename: 'banana_orange_tray.jpg',
            created_at: new Date(Date.now() - 10800000).toISOString(),
            fruit_count: 3,
            is_demo: true,
          },
        ],
        is_empty: false,
        is_demo_session: true,
      }, 'Demo session statistics retrieved successfully.');
    }

    return apiSuccess(res, {
      total_analyses: 0,
      total_fruits_detected: 0,
      average_quality_confidence: 0.0,
      fruit_distribution: {},
      quality_distribution: {
        Excellent: 0,
        Good: 0,
        Fair: 0,
        Poor: 0,
      },
      recent_analyses: [],
      is_empty: true,
    }, 'No analysis data available yet.');
  }

  let totalFruits = 0;
  let confSum = 0;
  const fruitDist: Record<string, number> = {};
  const qualityDist: Record<string, number> = {
    Excellent: 0,
    Good: 0,
    Fair: 0,
    Poor: 0,
  };

  records.forEach((rec) => {
    const dets = rec.detections || [];
    totalFruits += dets.length;

    dets.forEach((d: any) => {
      const fType = d.fruit_type || 'Other';
      fruitDist[fType] = (fruitDist[fType] || 0) + 1;

      const qClass = d.quality?.class || 'Good';
      const conf = Number(d.quality?.confidence || 0);
      confSum += conf;

      qualityDist[qClass] = (qualityDist[qClass] || 0) + 1;
    });
  });

  const avgConf = totalFruits > 0 ? Number((confSum / totalFruits).toFixed(4)) : 0.0;

  return apiSuccess(res, {
    total_analyses: records.length,
    total_fruits_detected: totalFruits,
    average_quality_confidence: avgConf,
    fruit_distribution: fruitDist,
    quality_distribution: qualityDist,
    recent_analyses: records.slice(0, 5),
    is_empty: false,
  }, 'Database statistics retrieved successfully.');
});

// Fallback for any other /api/* route to ALWAYS return JSON 404 - NEVER return HTML
app.all('/api/*', (req: Request, res: Response) => {
  return apiError(res, 'NOT_FOUND', `API route '${req.method} ${req.path}' does not exist.`, 404);
});

// Global error handler for JSON error responses
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Server Error]', err);
  const status = err.status || 500;
  return apiError(res, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected server error occurred.', status);
});

// ==========================================
// VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      const mlUrl = process.env.PYTHON_ML_URL || 'NOT SET — predictions will return 503';
      console.log(`[FruitVision DL Server] Running on http://0.0.0.0:${PORT}`);
      console.log(`[FruitVision DL Server] PYTHON_ML_URL: ${mlUrl}`);
      console.log(`[FruitVision DL Server] MONGODB_URI: ${process.env.MONGODB_URI ? 'configured' : 'NOT SET — using in-memory fallback'}`);
      console.log(`[FruitVision DL Server] DEMO_MODE: ${isDemoMode()}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
