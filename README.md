# FruitVision DL — Intelligent Vision-Based Fruit Quality Assessment

A full-stack deep learning web application for fruit detection and quality grading using YOLOv8 (detection) and EfficientNetV2-S (quality classification).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│             React + TypeScript (Vite SPA)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────────────┐
│               Node.js / Express (server.ts)                      │
│  • Authentication (JWT + MongoDB)                                │
│  • Prediction history (MongoDB)                                  │
│  • Proxies /api/predict → Python ML service                      │
│  • Serves static frontend (dist/)                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (PYTHON_ML_URL)
┌──────────────────────▼──────────────────────────────────────────┐
│          Python Flask ML Microservice (backend/)                 │
│  • YOLOv8 fruit detection (models/yolo/best.pt)                  │
│  • EfficientNetV2-S quality grading (models/efficientnet/*.pth)  │
│  • Internal endpoint: POST /ml/predict                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| Python | ≥ 3.11 |
| pip | latest |
| MongoDB Atlas | free tier |

---

## A. Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-username/fruit_grading_2.git
cd fruit_grading_2

# Node.js dependencies
npm install

# Python dependencies (ML microservice)
pip install -r requirements.txt
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random string for JWT signing |
| `PYTHON_ML_URL` | ✅ | URL of the Flask ML service (`http://localhost:5000` locally) |
| `ML_INTERNAL_SECRET` | ✅ | Shared secret between Node.js and Flask |

### 3. Model Setup

#### Option A — You have custom trained weights
Place your trained model weights:
```
models/yolo/best.pt                          ← YOLOv8 trained on your fruit dataset
models/efficientnet/efficientnet_v2.pth      ← EfficientNetV2-S 4-class quality model
```

Or use the download script:
```bash
# Set in .env:
# YOLO_MODEL_DOWNLOAD_URL=https://your-host/best.pt
# EFFICIENTNET_MODEL_DOWNLOAD_URL=https://your-host/efficientnet_v2.pth
python scripts/download_models.py
```

#### Option B — No custom weights (real AI, COCO pretrained fallback)
If `models/yolo/best.pt` is absent, the system **automatically downloads YOLOv8n** (pretrained on COCO) on first prediction. This enables real detection of:
- 🍎 Apple (COCO class 47)
- 🍌 Banana (COCO class 46)
- 🍊 Orange (COCO class 49)

Quality grading (Excellent/Good/Fair/Poor) uses real HSV color + texture analysis when custom EfficientNet weights are absent.

> **For best accuracy**: train your EfficientNetV2-S on a fruit quality dataset (e.g., [Fruits 360](https://www.kaggle.com/datasets/moltean/fruits) or the [Fruit Quality Dataset](https://www.kaggle.com/datasets/shashwatwork/fruitqualitydataset)).

### 4. Run Locally

**Terminal 1 — Python ML Service:**
```bash
python -m backend.app
# Starts Flask on http://localhost:5000
```

**Terminal 2 — Node.js Dev Server:**
```bash
npm run dev
# Starts Express + Vite on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### 5. Test the Complete Flow

1. Go to http://localhost:3000
2. Click **Sign Up** → create an account
3. Log in with your credentials
4. Go to **Analysis** → upload a fruit image (jpg/png/webp)
5. Wait for prediction (~5–15s on first run while model downloads)
6. View results: bounding boxes, fruit type, quality grade
7. Check **History** to see saved predictions
8. Click **Logout**

---

## B. Environment Variables Reference

### Node.js Server (`server.ts`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB Atlas URI. Required for persistent auth. |
| `JWT_SECRET` | (insecure default) | Secret for signing JWT tokens. **Change in production.** |
| `PYTHON_ML_URL` | — | URL to the Flask ML service. Required for predictions. |
| `ML_INTERNAL_SECRET` | `fruitvision-ml-internal-secret` | Shared secret header for server-to-server auth. |
| `PORT` | `3000` | Port for the Node.js server. |
| `NODE_ENV` | `development` | Set to `production` when serving built frontend. |
| `DEMO_MODE` | `false` | Set `true` only for demo/presentation without real AI. |

### Python ML Service (`backend/`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | Optional. Only needed in standalone Python mode. |
| `ML_INTERNAL_SECRET` | `fruitvision-ml-internal-secret` | Must match Node.js value. |
| `YOLO_MODEL_PATH` | `models/yolo/best.pt` | Path to YOLO weights. |
| `EFFICIENTNET_MODEL_PATH` | `models/efficientnet/efficientnet_v2.pth` | Path to EfficientNet weights. |
| `YOLO_MODEL_DOWNLOAD_URL` | — | URL to auto-download YOLO weights. |
| `EFFICIENTNET_MODEL_DOWNLOAD_URL` | — | URL to auto-download EfficientNet weights. |
| `PORT` | `5000` | Flask server port. |
| `FLASK_ENV` | `production` | Set to `development` for debug mode. |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins. Set to your frontend URL in production. |

---

## C. Production Deployment

### Recommended Architecture

```
Frontend + Node.js API  →  Vercel       (free tier)
Python ML Service       →  Railway      (or Render, free tier)
Database                →  MongoDB Atlas (free tier M0)
```

### Step 1 — Deploy Python ML Service to Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → select this repo
3. Set **Start Command**: `gunicorn backend.app:app -w 1 --timeout 120 -b 0.0.0.0:$PORT`
4. Set environment variables in Railway dashboard:
   ```
   ML_INTERNAL_SECRET=<generate a random string>
   YOLO_MODEL_DOWNLOAD_URL=<URL to your best.pt>
   EFFICIENTNET_MODEL_DOWNLOAD_URL=<URL to your efficientnet_v2.pth>
   FLASK_ENV=production
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
5. Note the Railway public URL (e.g., `https://fruitvision-ml.railway.app`)

> **Model weights on Railway**: Railway has ephemeral storage. Your models will re-download on each restart.
> **Solution**: Host your weights at a persistent URL (HuggingFace Hub, S3, Cloudflare R2) and set the `*_DOWNLOAD_URL` env vars.

### Step 2 — Deploy Frontend + Node.js to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard (Project Settings → Environment Variables):
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<your-secret>
   PYTHON_ML_URL=https://fruitvision-ml.railway.app
   ML_INTERNAL_SECRET=<same value as Railway>
   NODE_ENV=production
   DEMO_MODE=false
   ```
4. Deploy: `vercel --prod`

### Step 3 — MongoDB Atlas Setup

1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user and get connection string
3. Whitelist `0.0.0.0/0` in Network Access (or Vercel/Railway IPs)
4. Database name: `fruit_quality_db` (auto-created)
5. Collections used: `users`, `predictions`

---

## D. Model Hosting (For Your Custom Weights)

Since `.pt` and `.pth` files are typically >100MB, they cannot be committed to GitHub. Use one of:

| Platform | Cost | Setup |
|---|---|---|
| **HuggingFace Hub** | Free | `huggingface-cli upload username/repo best.pt` → set `YOLO_MODEL_DOWNLOAD_URL=hf://username/repo/best.pt` |
| **GitHub Releases** | Free (≤2GB) | Upload as release asset → get raw download URL |
| **Cloudflare R2** | Free (10GB/mo) | Upload via dashboard → get public URL |
| **AWS S3** | ~$0.023/GB | `aws s3 cp best.pt s3://bucket/` → presigned URL |

---

## E. File Structure

```
fruit_grading_2/
├── server.ts              ← Node.js backend (auth, history, proxy to ML)
├── vercel.json            ← Vercel deployment config
├── Procfile               ← Railway/Render deployment
├── render.yaml            ← Render one-click deploy
├── requirements.txt       ← Python dependencies (includes torch, ultralytics)
├── .env.example           ← Template for all environment variables
│
├── src/                   ← React frontend (TypeScript)
│   ├── services/api.ts    ← Frontend API client
│   ├── config/api.ts      ← API base URL config
│   └── components/        ← UI components
│
├── backend/               ← Python Flask ML microservice
│   ├── app.py             ← Flask application factory
│   ├── routes/
│   │   ├── ml.py          ← /ml/predict (internal ML endpoint)
│   │   ├── auth.py        ← /api/auth/* (standalone mode)
│   │   └── predictions.py ← /api/predictions (standalone mode)
│   └── services/
│       ├── ml_inference.py      ← Orchestrates YOLO + EfficientNet
│       ├── yolo_service.py      ← YOLO detection (auto-downloads YOLOv8n)
│       └── efficientnet_service.py ← Quality grading (custom or CV analysis)
│
├── models/
│   ├── yolo/best.pt             ← YOLO weights (place here or set download URL)
│   └── efficientnet/
│       └── efficientnet_v2.pth  ← EfficientNet weights (place here or download)
│
├── config/
│   ├── classes.json       ← Quality classes and recommendations
│   └── model_config.json  ← Model architecture configuration
│
└── scripts/
    └── download_models.py ← Downloads model weights from configured URLs
```

---

## F. Troubleshooting

### "ML_BACKEND_NOT_CONFIGURED" error on predict
→ Set `PYTHON_ML_URL` in your `.env` and make sure the Flask service is running.

### "No fruits were detected"
→ The image may not contain detectable fruit. YOLOv8n (COCO fallback) detects apple, banana, orange. Use a clear fruit image.

### MongoDB connection fails
→ Check `MONGODB_URI` value and ensure your IP is whitelisted in Atlas Network Access.

### Flask starts but predict returns 502 from Node.js
→ Check `ML_INTERNAL_SECRET` matches in both `.env` files (Node.js and Python).

### torch not found / ultralytics not found
→ Run `pip install -r requirements.txt` in the project root.

### Model download is slow on first prediction
→ YOLOv8n auto-download is ~6MB. EfficientNetV2-S ImageNet weights are ~84MB. This only happens once; weights are cached by ultralytics and torchvision.
