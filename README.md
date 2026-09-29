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

## A. Local Setup (Windows)

### 1. Prerequisites
- **Windows 10/11**
- **Git** (to clone the repository)
- **Node.js**: Download and install the latest LTS version (≥ 18.x) from [nodejs.org](https://nodejs.org/).
- **Python**: Download and install Python (≥ 3.11) from [python.org](https://www.python.org/downloads/). Ensure you check **"Add Python to PATH"** during installation.

### 2. Clone the Repository
Open PowerShell or Command Prompt and run:
```powershell
git clone https://github.com/your-username/fruit_grading_2.git
cd fruit_grading_2
```

### 3. Node.js Setup
Install the frontend and backend Node.js dependencies:
```powershell
npm install
```

### 4. Python Setup (ML Microservice)
It is recommended to use a virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\activate
```
Install the required Python packages:
```powershell
pip install -r requirements.txt
```

### 5. Environment Variables
Copy the example environment file:
```powershell
Copy-Item .env.example .env
```
Open `.env` in a text editor (like VS Code or Notepad) and ensure the following are set:
- `MONGODB_URI`: (Required for auth/history) Your MongoDB Atlas connection string.
- `JWT_SECRET`: Any random string (e.g. `my-local-secret-123`).
- `PYTHON_ML_URL`: `http://localhost:5000` (Local URL of the Flask service).
- `ML_INTERNAL_SECRET`: A matching random string to authenticate Node to Flask.
- `PORT`: `3000` (Node server port).

### 6. Run the Application

You will need **two terminal windows**.

**Terminal 1 — Python Flask ML Service:**
Make sure your virtual environment is active, then start Flask:
```powershell
# Inside fruit_grading_2 directory
.\venv\Scripts\activate
$env:FLASK_ENV="development"
$env:PORT="5000"
python -m backend.app
```
*(Leave this running. It will listen on http://localhost:5000)*

**Terminal 2 — Node.js / React Dev Server:**
Open a new PowerShell window, navigate to the folder, and start the Node app:
```powershell
# Inside fruit_grading_2 directory
npm run dev
```
*(Leave this running. It will listen on http://localhost:3000)*

### 7. View the Application
Open your web browser and go to:
**http://localhost:3000**

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
