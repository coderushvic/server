const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Minimal endpoint
app.get('/', (req, res) => res.send('Server deployed successfully!'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
