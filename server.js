// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// MySQL Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Test DB
db.getConnection()
  .then(() => console.log('✅ Connected to MySQL'))
  .catch(err => console.log('❌ DB Error:', err));

// Session Store
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let error;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user.id, username: user.username };
      return res.redirect('/dashboard');
    } else {
      error = 'Invalid username or password';
    }
  } catch (err) {
    console.error(err);
    error = 'Server error';
  }

  res.render('login', { error });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.use((req, res) => {
  res.status(404).send('<h1>Page Not Found</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NADHICOMEL running at http://localhost:${PORT}`);
});