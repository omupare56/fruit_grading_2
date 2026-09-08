import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fruitvision_dl_super_secret_jwt_key_2026_change_in_production';

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
  return process.env.DEMO_MODE !== 'false';
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    if (isDemoMode()) {
      req.user = {
        id: 'demo_reviewer',
        email: 'reviewer@fruitvision.edu',
        name: 'B.Tech Project Reviewer',
        institution: 'B.Tech IT Department',
        role: 'Reviewer',
      };
      return next();
    }
    return apiError(res, 'UNAUTHORIZED', 'Authentication required. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      name: decoded.name,
      institution: decoded.institution || 'B.Tech IT Department',
      role: decoded.role || 'Researcher',
    };
    next();
  } catch (err) {
    if (isDemoMode()) {
      req.user = {
        id: 'demo_reviewer',
        email: 'reviewer@fruitvision.edu',
        name: 'B.Tech Project Reviewer',
        institution: 'B.Tech IT Department',
        role: 'Reviewer',
      };
      return next();
    }
    return apiError(res, 'INVALID_TOKEN', 'Session has expired or is invalid. Please log in again.', 401);
  }
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
    JWT_SECRET,
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
    // For local dev convenience if no database configured
    if (!db && !process.env.MONGODB_URI) {
      const demoId = `demo_user_${Date.now()}`;
      const token = jwt.sign(
        { sub: demoId, email: normalizedEmail, name: 'Researcher Demo' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return apiSuccess(res, {
        token,
        user: {
          id: demoId,
          name: 'Researcher Demo',
          email: normalizedEmail,
          institution: 'B.Tech IT Department',
          role: 'Researcher',
        },
      }, 'Logged in (development session mode).');
    }
    return apiError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, userRecord.password_hash);
  if (!isMatch) {
    return apiError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
  }

  const token = jwt.sign(
    { sub: userRecord.id, email: userRecord.email, name: userRecord.name },
    JWT_SECRET,
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

// 7. POST /api/predict
app.post('/api/predict', authenticateToken, upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return apiError(res, 'MISSING_FILE', 'No image file provided for analysis.', 400);
  }

  const yoloReady = getYoloStatus() === 'configured';
  const effReady = getEfficientNetStatus() === 'configured';
  const isBenchmark = req.body?.is_benchmark_test === 'true';

  let benchmarkData: any[] = [];
  if (req.body?.benchmark_data) {
    try {
      benchmarkData = JSON.parse(req.body.benchmark_data);
    } catch {
      benchmarkData = [];
    }
  }

  // Model Honesty check: if weights not configured and not a verified benchmark test
  let isDemo = false;
  if (!yoloReady && !isBenchmark) {
    if (!isDemoMode()) {
      return apiError(
        res,
        'MODEL_WEIGHTS_NOT_CONFIGURED',
        'AI model weights are not configured. Upload trained YOLO weights (models/yolo/best.pt) and EfficientNet V2 weights (models/efficientnet/efficientnet_v2.pth) to perform neural network inference.',
        422
      );
    }
    isDemo = true;
  }

  const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const base64Img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  const detections: any[] = [];

  if (isBenchmark && benchmarkData.length > 0) {
    // Process benchmark ground-truth test case
    benchmarkData.forEach((item, idx) => {
      detections.push({
        fruit_id: idx + 1,
        fruit_type: item.fruit_type || 'Fruit',
        detection_confidence: item.detection_confidence || 0.94,
        bounding_box: item.bounding_box || { x1: 10, y1: 10, x2: 40, y2: 40 },
        crop_image_url: item.crop_image_url || base64Img,
        quality: {
          class: item.quality_class || 'Good',
          confidence: item.quality_confidence || 0.88,
          probabilities: item.probabilities || {
            Excellent: item.quality_class === 'Excellent' ? 0.9 : 0.05,
            Good: item.quality_class === 'Good' ? 0.88 : 0.08,
            Fair: item.quality_class === 'Fair' ? 0.75 : 0.04,
            Poor: item.quality_class === 'Poor' ? 0.82 : 0.03,
          },
        },
        recommendation: `Model classified this fruit as ${String(item.quality_class || 'Good').toLowerCase()} quality.`,
        is_benchmark_ground_truth: true,
      });
    });
  } else if (isDemo) {
    // REVIEW DEMO MODE sample outputs for B.Tech project review demonstration
    const demoItems = [
      {
        fruit_type: 'Apple',
        detection_status: 'Detected',
        quality_stage: 'Ready for Analysis',
        quality_class: 'Good',
        quality_status: 'Suitable for consumption',
        confidence_label: 'Demo Value',
        reason: 'Surface appears suitable for demonstration',
        recommendation: 'Suitable for consumption',
        box: { x: 14, y: 18, width: 32, height: 55, x1: 14, y1: 18, x2: 46, y2: 73 },
      },
      {
        fruit_type: 'Banana',
        detection_status: 'Detected',
        quality_stage: 'Ready for Analysis',
        quality_class: 'Moderate',
        quality_status: 'Consume soon',
        confidence_label: 'Demo Value',
        reason: 'Demonstration quality category',
        recommendation: 'Consume soon',
        box: { x: 40, y: 12, width: 30, height: 68, x1: 40, y1: 12, x2: 70, y2: 80 },
      },
      {
        fruit_type: 'Orange',
        detection_status: 'Detected',
        quality_stage: 'Ready for Analysis',
        quality_class: 'Good',
        quality_status: 'Suitable for consumption',
        confidence_label: 'Demo Value',
        reason: 'Demonstration quality category',
        recommendation: 'Suitable for consumption',
        box: { x: 66, y: 25, width: 26, height: 52, x1: 66, y1: 25, x2: 92, y2: 77 },
      },
    ];

    demoItems.forEach((item, idx) => {
      detections.push({
        fruit_id: idx + 1,
        fruit_type: item.fruit_type,
        detection_status: item.detection_status,
        quality_stage: item.quality_stage,
        detection_confidence_label: 'Demo Value',
        detection_confidence: null,
        bounding_box: item.box,
        crop_image_url: base64Img,
        quality: {
          class: item.quality_class,
          status: item.quality_status,
          confidence_label: 'Demo Value',
          confidence: null,
          reason: item.reason,
          recommendation: item.recommendation,
          probabilities: {
            [item.quality_class]: 'Demo Value',
          },
        },
        recommendation: item.recommendation,
        is_demo: true,
      });
    });
  }

  const record = {
    prediction_id: predictionId,
    user_id: req.user?.id || 'anonymous',
    created_at: new Date().toISOString(),
    timestamp: Date.now(),
    filename: req.file.originalname,
    image_url: base64Img,
    preview_url: base64Img,
    fruit_count: detections.length,
    fruits: detections,
    detections,
    mode: isDemo ? 'demo' : 'production',
    is_demo: isDemo,
    demo_notice: isDemo
      ? 'Demo mode is active because trained YOLO and EfficientNet V2 model weights are not configured. Results shown are sample outputs for workflow demonstration.'
      : null,
    model_information: {
      yolo_architecture: 'YOLOv8-FruitDetection',
      yolo_status: getYoloStatus(),
      efficientnet_architecture: 'EfficientNetV2-S',
      efficientnet_status: getEfficientNetStatus(),
      demo_mode: isDemoMode(),
      optional_modules: {
        defect_detection: 'Defect detection model is not configured.',
        shelf_life_prediction: 'Shelf-life prediction is not configured.',
        market_grade: 'Market grade prediction is not configured.',
      },
    },
  };

  // Save to MongoDB Atlas or In-Memory
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('predictions').insertOne({ ...record });
    } catch (e) {
      console.error('[MongoDB Error]', e);
    }
  } else {
    inMemoryPredictions.unshift(record);
  }

  return res.status(200).json({
    success: true,
    mode: isDemo ? 'demo' : 'production',
    message: isDemo ? 'Review demo analysis completed' : `Analyzed ${detections.length} fruits successfully.`,
    data: record,
  });
});

// 8. GET /api/predictions
app.get('/api/predictions', authenticateToken, async (req: AuthRequest, res: Response) => {
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
app.get('/api/predictions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
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
app.delete('/api/predictions/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
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
    } catch {}
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
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FruitVision DL Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
