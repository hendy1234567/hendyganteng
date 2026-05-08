const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Hendy281106', 
  database: 'diamante_db'
});

db.connect(err => {
  if (err) {
    console.log('Koneksi gagal:', err);
  } else {
    console.log('MySQL Connected');
  }
});

app.use(express.static(path.join(__dirname)));

let reservations = [];

app.get('/', (req, res) => {
  res.send('Server jalan');
});

app.post('/reservations', (req, res) => {
  const { name, email, keperluan, pesan, phone } = req.body;

  const query = `
    INSERT INTO reservations (name, email, keperluan, pesan, phone)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [
    name,
    email,
    keperluan.join(', '), 
    pesan,
    phone
  ], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: 'Gagal simpan' });
    }

    res.json({ message: 'Berhasil disimpan ke database' });
  });
});

app.get('/reservations', (req, res) => {
  db.query('SELECT * FROM reservations', (err, results) => {
    if (err) return res.json(err);
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});

app.delete('/reservations/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM reservations WHERE id = ?', [id], (err, result) => {
    if (err) return res.json({ message: 'Gagal hapus' });

    res.json({ message: 'Data berhasil dihapus' });
  });
});

const session = require('express-session');

app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT * FROM admin WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (results.length > 0) {
        req.session.user = results[0];
        res.json({ message: 'Login berhasil' });
      } else {
        res.json({ message: 'Login gagal' });
      }
    }
  );
});

function isLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Harus login dulu' });
  }
}

app.get('/reservations', isLogin, (req, res) => {
  db.query('SELECT * FROM reservations', (err, results) => {
    if (err) return res.json(err);
    res.json(results);
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout berhasil' });
});