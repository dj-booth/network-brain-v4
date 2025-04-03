const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const createTablesSQL = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    location TEXT,
    referral_source TEXT,
    current_plan TEXT,
    startup_name TEXT,
    cofounders_context TEXT,
    startup_differentiator TEXT,
    startup_validation TEXT,
    job_search_preferences TEXT,
    inspiring_companies TEXT,
    hypothetical_startup_idea TEXT,
    timeline_to_start TEXT,
    skillset TEXT,
    skillset_extra TEXT,
    additional_interests TEXT,
    desired_introductions TEXT,
    long_term_goal TEXT,
    sentiment TEXT,
    summary TEXT,
    transcript TEXT,
    submitted_at TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    credibility_score NUMERIC(5,3) CHECK (credibility_score >= 0 AND credibility_score <= 10),
    profile_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_scraped_at TIMESTAMP
);

-- Embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('intro_draft', 'intro_sought', 'reason_to_introduce')),
    content TEXT,
    is_edited_by_admin BOOLEAN DEFAULT false,
    last_edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Introductions table
CREATE TABLE IF NOT EXISTS introductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    to_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('suggested', 'sent', 'opted_in', 'declined')),
    method TEXT CHECK (method IN ('email', 'in_person', 'other')),
    intro_draft_id UUID REFERENCES embeddings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    CONSTRAINT different_profiles CHECK (from_profile_id != to_profile_id)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    email_subject TEXT,
    email_body TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bcc_logged BOOLEAN DEFAULT false
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_metadata JSONB,
    performed_by TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_credibility ON profiles(credibility_score);
CREATE INDEX IF NOT EXISTS idx_embeddings_profile ON embeddings(profile_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_type ON embeddings(type);
CREATE INDEX IF NOT EXISTS idx_introductions_profiles ON introductions(from_profile_id, to_profile_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_profile ON email_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile ON audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
`;

async function createSchema() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Creating schema...');
    await client.query(createTablesSQL);
    
    console.log('Schema created successfully!');
  } catch (error) {
    console.error('Failed to create schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createSchema(); 