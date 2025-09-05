-- migrations/001_initial_schema.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create rate_limit_tiers table
CREATE TABLE IF NOT EXISTS rate_limit_tiers (
    tier TEXT PRIMARY KEY,
    requests_per_hour INTEGER NOT NULL
);

-- Insert default tiers
INSERT OR IGNORE INTO rate_limit_tiers (tier, requests_per_hour) VALUES
('guest', 3),
('free', 8),
('premium', 10);

-- Create rate_limit_usage table
-- Identifier: 'user_<id>' for logged-in users, 'ip_<ip>' for guests
CREATE TABLE IF NOT EXISTS rate_limit_usage (
    identifier TEXT PRIMARY KEY,
    window_start DATETIME NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    last_access DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_identifier ON rate_limit_usage(identifier);