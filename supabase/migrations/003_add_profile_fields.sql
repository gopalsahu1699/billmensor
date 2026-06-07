-- Migration 003: Add profile fields for data retention and backup tracking

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 90;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_backup_at TIMESTAMPTZ;
