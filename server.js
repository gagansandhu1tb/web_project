import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Issue from './server/models/Issue.js';
import User from './server/models/User.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy .env.example to .env and add your Atlas password.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Use a strong secret in .env for production.');
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = payload;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

const seedUsers = async () => {
  const existingCount = await User.countDocuments();
  if (existingCount === 0) {
    const sampleUsers = [
      { name: 'Admin User', email: 'admin@stmarys.ac.uk', password: 'Admin123!', role: 'admin' },
      { name: 'Staff Member', email: 'staff@stmarys.ac.uk', password: 'Staff123!', role: 'staff' },
      { name: 'Student User', email: 'student@stmarys.ac.uk', password: 'Student123!', role: 'student' }
    ];

    await Promise.all(
      sampleUsers.map(async (user) => {
        const passwordHash = bcrypt.hashSync(user.password, 10);
        return User.create({
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role
        });
      })
    );

    console.log('Seeded default users: admin/staff/student');
  }
};

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await seedUsers();
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });

const geocodeLocation = async (query) => {
  if (!query) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FixMyCampus/1.0 (student project)'
    }
  });

  if (!response.ok) return null;
  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  return {
    lat: results[0].lat,
    lon: results[0].lon,
    displayName: results[0].display_name
  };
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/guidance', (req, res) => {
  res.json([
    {
      title: 'Describe the issue clearly',
      text: 'Include the location, what happened, and when you noticed the problem. Avoid vague terms like "it is broken".'
    },
    {
      title: 'Provide a useful location',
      text: 'Use building names, room numbers, or campus landmarks so maintenance teams can find the issue quickly.'
    },
    {
      title: 'Add an optional photo link',
      text: 'A photo can help maintenance staff understand the problem. Ensure the link is publicly accessible.'
    },
    {
      title: 'Consent and privacy',
      text: 'Reports are stored securely in MongoDB. Do not include personal or sensitive information in the description.'
    }
  ]);
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to login' });
  }
});

app.post('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with that email already exists.' });
    }

    if (!['admin', 'staff', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Choose admin, staff, or student.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({ name, email: normalizedEmail, passwordHash, role });

    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create user.' });
  }
});

app.get('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('name email role createdAt');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch users.' });
  }
});

app.put('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required.' });
    }
    if (!['admin', 'staff', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { name, role }, { new: true, runValidators: true }).select('name email role createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update user.' });
  }
});

app.delete('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete user.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ email: user.email, name: user.name, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch user' });
  }
});

app.get('/api/issues', authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch issues' });
  }
});

app.post('/api/issues', authenticateToken, async (req, res) => {
  try {
    const { category, building, location, description, photoUrl } = req.body;
    if (!category || !building || !location || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const locationGeo = await geocodeLocation(`${building} ${location}`);
    const issue = new Issue({
      category,
      building,
      location,
      description,
      photoUrl: photoUrl || '',
      reporterEmail: req.user.email,
      reportedAt: new Date(),
      locationGeo,
      status: 'New'
    });

    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create issue' });
  }
});

app.put('/api/issues/:id', authenticateToken, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.status === 'Resolved') {
      update.resolvedAt = new Date();
    }
    update.updatedAt = new Date();

    const issue = await Issue.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update issue' });
  }
});

app.get('/api/geocode', async (req, res) => {
  try {
    const query = req.query.q;
    const result = await geocodeLocation(query);
    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to geocode location' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`FixMyCampus API server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing process or set PORT to a free port in .env.`);
    process.exit(1);
  }
  throw err;
});
