CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    nationality VARCHAR(50),
    language VARCHAR(50),
    amount VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
