import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { apiRouter } from './api/routes.js';
import { logHub } from './websocket/hub.js';
dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
// Middlewares
app.use(cors());
app.use(express.json());
// API routes
app.use('/api', apiRouter);
// WebSocket setup for real-time logs & status
const wss = new WebSocketServer({ server, path: '/ws' });
logHub.setServer(wss);
// Static Frontend Serving (Vite build outputs to dist/public)
const publicDir = path.resolve(process.cwd(), 'dist', 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
            res.sendFile(path.join(publicDir, 'index.html'));
        }
    });
}
else {
    // If frontend not built yet, show a welcome message
    app.get('/', (req, res) => {
        res.send(`
      <html>
        <head><title>Telegram Auto-Plugger & Forwarder</title></head>
        <body style="font-family: sans-serif; background: #0e1621; color: white; padding: 40px; text-align: center;">
          <h2>🚀 Telegram Auto-Plugger & Forwarder Backend Running!</h2>
          <p>API is active on port ${PORT}.</p>
          <p>Run <code>npm run build:client</code> to compile the React dashboard.</p>
        </body>
      </html>
    `);
    });
}
// Start HTTP & WS Server
server.listen(PORT, () => {
    logHub.info('system', `Server listening on port ${PORT} (http://localhost:${PORT})`);
    console.log(`\n======================================================`);
    console.log(`🤖 Telegram Auto-Plugger & Forwarder Server`);
    console.log(`🌐 Web Dashboard & API: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`======================================================\n`);
});
// Graceful exit handling
process.on('SIGINT', () => {
    logHub.info('system', 'Received SIGINT, shutting down gracefully...');
    server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
    logHub.info('system', 'Received SIGTERM, shutting down gracefully...');
    server.close(() => process.exit(0));
});
