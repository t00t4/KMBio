-- KMBio Database Setup Script
-- This script creates the necessary tables for the KMBio MVP

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (should already exist from Supabase Auth)
-- This is just for reference, Supabase Auth handles user management
-- CREATE TABLE auth.users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email VARCHAR UNIQUE NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  make VARCHAR(30) NOT NULL,
  model VARCHAR(30) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('gasoline', 'ethanol', 'diesel', 'flex')),
  engine_size DECIMAL(3,1) NOT NULL CHECK (engine_size > 0 AND engine_size <= 10),
  supported_pids TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  distance DECIMAL(10,2), -- in kilometers
  duration INTEGER, -- in seconds
  average_consumption DECIMAL(5,2), -- L/100km
  max_speed DECIMAL(5,1), -- km/h
  average_rpm DECIMAL(6,1),
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip events table
CREATE TABLE IF NOT EXISTS trip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('harsh_acceleration', 'harsh_braking', 'high_rpm', 'idle_time', 'high_temp')),
  severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high')),
  value DECIMAL(10,2),
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly summaries table
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_distance DECIMAL(10,2),
  total_duration INTEGER,
  average_consumption DECIMAL(5,2),
  efficiency_score DECIMAL(3,1),
  trips_count INTEGER DEFAULT 0,
  summary_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 1,
  is_read BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_active ON vehicles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_user_id_start_time ON trips(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id_timestamp ON trip_events(trip_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_tips_user_id_read ON tips(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Vehicles policies
CREATE POLICY "Users can view their own vehicles" ON vehicles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" ON vehicles
    FOR DELETE USING (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Users can view their own trips" ON trips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON trips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Trip events policies
CREATE POLICY "Users can view trip events for their trips" ON trip_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_events.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trip events for their trips" ON trip_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_events.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Weekly summaries policies
CREATE POLICY "Users can view their own weekly summaries" ON weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly summaries" ON weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly summaries" ON weekly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Tips policies
CREATE POLICY "Users can view their own tips" ON tips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tips" ON tips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tips" ON tips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tips" ON tips
    FOR DELETE USING (auth.uid() = user_id);