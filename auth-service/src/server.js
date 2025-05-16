// src/server.js

const express  = require('express');
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

dotenv.config();  // Load .env if present (for local development)

const { MONGO_URI, PORT = 4000, JWT_SECRET } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error('❌ MONGO_URI and JWT_SECRET must be set');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Track whether we’ve successfully connected to MongoDB
let dbConnected = false;

// Retry logic for MongoDB connection
async function connectWithRetry(retries = 60, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected');
      dbConnected = true;
      return;
    } catch (err) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`
      );
      if (attempt === retries) {
        console.error('💥 All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
      console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

// Define User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },  // hashed password
});
const User = mongoose.model('User', userSchema);

// Liveness endpoint: always returns 200 so Kubernetes won't kill the Pod
app.get('/health', (_req, res) => {
  res.send('OK');
});

// Readiness endpoint: only returns 200 once MongoDB is connected
app.get('/ready', (_req, res) => {
  return dbConnected
    ? res.send('OK')
    : res.status(503).send('DB connecting');
});

// Signup endpoint: create a new user with hashed password
app.post('/signup', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (await User.findOne({ username })) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    await new User({ username, password: hash }).save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login endpoint: verify credentials and return JWT
app.post('/login', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Start HTTP server immediately so liveness/readiness probes can succeed
app.listen(PORT, () => {
  console.log(`🚀 Auth service listening on port ${PORT}`);
  // Then initiate MongoDB connection attempts in the background
  connectWithRetry();
});
