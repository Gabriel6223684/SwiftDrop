-- Migration: Add auth fields to users + reset_codes table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS photo VARCHAR(500),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON reset_codes(code);
