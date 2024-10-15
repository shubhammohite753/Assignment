const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
//   user: 'your_pg_user',
  user: 'postgres',
  host: 'localhost',
  database: 'university_db',
  password: 'Shubham@123',
  port: 5000,
});

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token) {
    jwt.verify(token, 'admin_secret', (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ message: 'Token required' });
  }
};

// Admin login route
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = 'admin';
  const adminPassword = 'password';

  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ username }, 'admin_secret', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// API to add/update/delete fields/streams, subjects, and marks for admin
app.post('/admin/add-field', authenticateAdmin, async (req, res) => {
  const { name } = req.body;
  const result = await pool.query('INSERT INTO fields (name) VALUES ($1) RETURNING *', [name]);
  res.json(result.rows[0]);
});

// Students can sign up
app.post('/students/signup', async (req, res) => {
  const { first_name, last_name, email, password, enrollment_year, field_id } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO students (first_name, last_name, email, password, enrollment_year, field_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [first_name, last_name, email, hashedPassword, enrollment_year, field_id]
  );
  res.json(result.rows[0]);
});

// More CRUD routes here...

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

