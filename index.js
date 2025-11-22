// server/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Load env values
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const RENDER_BASE_URL = process.env.RENDER_BASE_URL || null;

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('Created uploads dir at', UPLOADS_DIR);
}

// CORS - allow your frontend origin(s)
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // set to your frontend origin for production
  credentials: true,
}));

// Serve uploads as static
app.use('/uploads', express.static(UPLOADS_DIR, {
  index: false,
  extensions: ['png', 'jpg', 'jpeg', 'webp']
}));

// Multer storage
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
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Upload endpoint — field name: file
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    // Determine base URL
    const baseUrl = process.env.RENDER_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${encodeURIComponent(req.file.filename)}`;
    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
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

// Start
app.listen(PORT, () => {
  console.log(`Upload server listening on port ${PORT}`);
  console.log('UPLOADS_DIR:', UPLOADS_DIR);
});
