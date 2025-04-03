-- Create profile_notes table
CREATE TABLE IF NOT EXISTS profile_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by profile_id
CREATE INDEX IF NOT EXISTS idx_profile_notes_profile_id ON profile_notes(profile_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profile_notes_updated_at
    BEFORE UPDATE ON profile_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 