const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json()); // For parsing application/json
app.use(cors()); // Enable CORS

// PostgreSQL connections

// Primary DB for write operations (form submissions)
const primaryPool = new Pool({
    host: process.env.DB_HOST,  // Primary RDS DB
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Read Replica DB for read operations (search queries)
const replicaPool = new Pool({
    host: process.env.READ_REPLICA_HOST,  // Read Replica DB
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Ensure primary DB connection
primaryPool.connect((err) => {
    if (err) {
        console.error('Failed to connect to the primary database:', err);
        process.exit(1);
    }
    console.log('Connected to primary database');
});

// Route to handle form submissions (writes to primary DB)
app.post('/submit', (req, res) => {
    const { name, age, mobile, nationality, language, pin } = req.body;

    // Basic validation
    if (!name || !age || !mobile || !nationality || !language || !pin) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // SQL query to insert data into the user table in primary DB
    const insertQuery = `
    INSERT INTO "users" (name, age, mobile, nationality, language, pin)
    VALUES ($1, $2, $3, $4, $5, $6)`;

    primaryPool.query(insertQuery, [name, age, mobile, nationality, language, pin], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error inserting data.' });
        }
        res.status(200).json({ message: 'User information submitted successfully!' });
    });
});

// Route to handle search queries (reads from read replica DB)
app.get('/search', (req, res) => {
    const query = req.query.query;

    // SQL query to fetch data from read replica DB
    const sql = 'SELECT * FROM users WHERE name = $1 OR mobile = $2';

    replicaPool.query(sql, [query, query], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (results.rows.length > 0) {
            res.json(results.rows[0]);  // Return the first matching user
        } else {
            res.status(404).json({ message: 'User not found' });
        }
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
