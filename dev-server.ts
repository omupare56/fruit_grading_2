import { createServer as createViteServer } from 'vite';
import app from './server.js';
import dotenv from 'dotenv';

dotenv.config();

async function startDevServer() {
  console.log('[FruitVision] Starting Vite dev server...');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    const mlUrl = process.env.PYTHON_ML_URL || 'NOT SET — predictions will return 503';
    console.log(`[FruitVision Dev Server] Running on http://localhost:${PORT}`);
    console.log(`[FruitVision Dev Server] PYTHON_ML_URL: ${mlUrl}`);
  });
}

startDevServer();
