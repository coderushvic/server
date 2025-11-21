// server/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads directory: allow overriding via env (useful when mounting Render persistent disk)
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// Ensure uploads directory exists on start
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Uploads directory ensured at', UPLOADS_DIR);
  } catch (err) {
    console.error('Failed creating uploads dir', err);
    process.exit(1);
  }
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  }
});

// Validate MIME types
const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PNG, JPG, JPEG and WebP are allowed.'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit; adjust as needed
  }
});

// Serve uploads directory statically at /uploads
// Note: prefer using an env PROXY_BASE or RENDER_BASE_URL for absolute URL generation.
app.use('/uploads', express.static(UPLOADS_DIR, {
  index: false,
  extensions: ['png', 'jpg', 'jpeg', 'webp']
}));

// Simple health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Upload endpoint - accepts field 'file'
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Base URL: prefer env var, otherwise construct from request
    // Set REACT_APP_RENDER_URL on client to the Render domain; for server, set RENDER_BASE_URL optional.
    const baseUrl = process.env.RENDER_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}/uploads/${encodeURIComponent(req.file.filename)}`;

    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  res.status(500).json({ error: 'Server error' });
});

async function start() {
  // Ensure directory exists; when using Render persistent disk, set UPLOADS_DIR env to the mounted path.
  // If the path doesn't exist, mkdir will create it.
  await ensureUploadsDir();

  app.listen(PORT, () => {
    console.log(`Image upload server listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
