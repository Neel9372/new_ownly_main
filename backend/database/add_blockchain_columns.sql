-- Migration: Add blockchain columns to properties table
-- Run this against your ownly_db database

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS on_chain_property_id INT,
  ADD COLUMN IF NOT EXISTS token_address VARCHAR(255);
