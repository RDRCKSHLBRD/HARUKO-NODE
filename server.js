// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from /public
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve assets for better path handling
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Parse JSON bodies from incoming requests
app.use(express.json());

// GET: Return JSON file contents from /data directory
app.get('/api/data/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'data', filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`⚠️ File not found: ${filename}`);
      return res.status(404).json({ error: 'File not found' });
    }

    try {
      const parsed = JSON.parse(data); // verify valid JSON
      res.json(parsed);
    } catch (parseErr) {
      console.error(`❌ Invalid JSON in ${filename}:`, parseErr);
      res.status(500).json({ error: 'Malformed JSON' });
    }
  });
});

// POST: Handle fake signup (no database)
app.post('/api/signup', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required',
    });
  }

  console.log(`✅ Signup received: ${name} <${email}>`);
  res.json({
    success: true,
    message: 'Thank you for signing up to our newsletter!',
  });
});

// Debugging routes
app.get('/api/debug/check-assets', (req, res) => {
  const assetDir = path.join(__dirname, 'public', 'assets');
  
  fs.readdir(assetDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read asset directory', details: err.message });
    }
    
    res.json({ 
      success: true, 
      assetPath: assetDir,
      files: files 
    });
  });
});

app.get('/api/debug/server-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    serverTime: new Date().toISOString(),
    publicPath: path.join(__dirname, 'public'),
    dataPath: path.join(__dirname, 'data')
  });
});

// Catch-all route - fixed to avoid path-to-regexp error
// Using a simple string path instead of regex or pattern
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Specific route for any other paths
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});