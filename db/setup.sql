-- Create the database if it doesn't exist
-- This needs to be run separately as you can't create a DB within a transaction
-- CREATE DATABASE haruko;

-- Create tables
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);