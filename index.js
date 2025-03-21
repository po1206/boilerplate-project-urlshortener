require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns'); // For DNS lookup
const bodyParser = require('body-parser');
const { URL } = require('url'); // To parse URLs

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
// app.get('/api/hello', function(req, res) {
//   res.json({ greeting: 'hello API' });
// });

// In-memory storage for URL mappings
const urlDatabase = {};
let shortUrlCounter = 1;

// Helper function to validate URLs using DNS lookup
function validateUrlWithDns(url, callback) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Perform DNS lookup
    dns.lookup(hostname, (err) => {
      if (err) {
        // If DNS lookup fails, the URL is invalid
        callback(false);
      } else {
        // If DNS lookup succeeds, the URL is valid
        callback(true);
      }
    });
  } catch (err) {
    // If URL parsing fails, it's invalid
    callback(false);
  }
}

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  // Validate the URL using DNS lookup
  validateUrlWithDns(url, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Generate a short URL
    const shortUrl = shortUrlCounter++;
    urlDatabase[shortUrl] = url;

    res.json({
      original_url: url,
      short_url: shortUrl,
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;
  const originalUrl = urlDatabase[short_url];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'short url not found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
