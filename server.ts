import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import commentaryHandler from './api/commentary';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Stage 4: Result commentary endpoint (delegates to Vercel-compatible serverless handler)
  app.post('/api/commentary', async (req, res) => {
    // Delegates to shared handler ensuring strict validation, 6s timeout, and fallbackUsed guarantee
    return commentaryHandler(req, res);
  });

  // Vite middleware for development vs static build serving for production
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
