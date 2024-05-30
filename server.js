const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        mobile TEXT,
        email TEXT UNIQUE,
        password TEXT,
        parentName TEXT
    )`);
    db.run(`CREATE TABLE content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT
    )`);
});

app.post('/signup', (req, res) => {
    const { fullname, mobile, email, password, parentName } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.json({ success: false, message: 'Error hashing password' });

        db.run(`INSERT INTO users (fullname, mobile, email, password, parentName) VALUES (?, ?, ?, ?, ?)`,
            [fullname, mobile, email, hash, parentName],
            (err) => {
                if (err) {
                    return res.json({ success: false, message: 'Error creating account' });
                }
                res.json({ success: true, message: 'Account created successfully' });
            });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: 'User not found' });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                if (email === 'admin@example.com' && password === 'admin') {
                    res.json({ success: true, message: 'Login successful', isAdmin: true });
                } else {
                    res.json({ success: true, message: 'Login successful', isAdmin: false, username: user.fullname });
                }
            } else {
                res.json({ success: false, message: 'Incorrect password' });
            }
        });
    });
});

app.post('/uploadContent', (req, res) => {
    const { text } = req.body;

    db.run(`INSERT INTO content (text) VALUES (?)`, [text], (err) => {
        if (err) {
            return res.json({ success: false, message: 'Error uploading content' });
        }
        res.json({ success: true, message: 'Content uploaded successfully' });
    });
});

app.get('/getContent', (req, res) => {
    db.all(`SELECT * FROM content`, [], (err, rows) => {
        if (err) {
            return res.json({ success: false, message: 'Error retrieving content' });
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
