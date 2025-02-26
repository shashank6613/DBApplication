const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER || 'admin',
    port: process.env.DB_PORT || 5432,
    password: process.env.DB_PASSWORD || 'admin1234',
    database: process.env.DB_NAME || 'survey'
});

pool.connect((err) => {
    if (err) {
        console.error('Failed to connect to the database:', err);
        process.exit(1);
    }
    console.log('Connected to database');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "users" (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            age INT NOT NULL,
            mobile VARCHAR(15) NOT NULL UNIQUE,
            nationality VARCHAR(50),
            language VARCHAR(50),
            amount VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

    pool.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            process.exit(1);
        }
        console.log('Table "users" created or already exists');
    });
});

// Route to check if a mobile number already exists
app.get('/checkMobile', (req, res) => {
    const mobile = req.query.mobile;
    const checkMobileQuery = 'SELECT 1 FROM users WHERE mobile = $1';

    pool.query(checkMobileQuery, [mobile], (err, result) => {
        if (err) {
            console.error('Error checking mobile number:', err);
            return res.status(500).json({ message: 'Error checking mobile number.' });
        }
        if (result.rows.length > 0) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    });
});

// Route to handle form submissions
app.post('/submit', (req, res) => {
    const { name, age, mobile, nationality, language, amount } = req.body;

    if (!name || !age || !mobile || !nationality || !language || !amount) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const insertQuery = `
        INSERT INTO "users" (name, age, mobile, nationality, language, amount)
        VALUES ($1, $2, $3, $4, $5, $6)`;

    pool.query(insertQuery, [name, age, mobile, nationality, language, amount], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error inserting data.' });
        }
        res.status(200).json({ message: 'User information submitted successfully!' });
    });
});

// Search endpoint
app.get('/search', (req, res) => {
    const query = req.query.query;
    const sql = 'SELECT * FROM users WHERE name = $1 OR mobile = $2';

    pool.query(sql, [query, query], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (results.rows.length > 0) {
            res.json(results.rows[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// Endpoint to get all users
app.get('/allUsers', (req, res) => {
    const getAllUsersQuery = 'SELECT * FROM users';

    pool.query(getAllUsersQuery, (err, result) => {
        if (err) {
            console.error('Error fetching all users:', err);
            return res.status(500).json({ message: 'Error fetching users.' });
        }
        res.json(result.rows); // Send all rows as JSON
    });
});


// Custom error handler middleware
app.use((err, req, res, next) => {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'An unexpected error occurred.' });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
