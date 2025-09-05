const express = require('express');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const RateLimitService = require('./services/rateLimitService');
const aiRoutes = require('./routes/ai');
const config = require('./config/app');

const app = express();
const db = new sqlite3.Database(config.DATABASE_PATH);

app.use(express.json());

// JWT auth middleware
app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { id: decoded.id, tier: decoded.tier };
        } catch (error) {
            console.error('JWT verification failed:', error.message);
            // Continue as guest if token is invalid
        }
    }
    next();
});

// Signup route
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    try {
        // Check if user exists
        const existing = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (existing) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password_hash, tier) VALUES (?, ?, ?, ?)',
                [username, email, password_hash, 'free'],
                function (err) {
                    if (err) reject(err);
                    resolve({ id: this.lastID });
                }
            );
        });

        // Generate JWT
        const token = jwt.sign({ id: result.id, tier: 'free' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Signup successful', token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id, username, email, password_hash, tier FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, tier: user.tier }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the AI API' });
});

// Schedule cleanup every 60 minutes
cron.schedule('0 * * * *', async () => {
    console.log('Running cache sync and cleanup job...');
    await RateLimitService.cleanupInactiveUsers();
    console.log('Cache sync and cleanup job completed');
});

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});