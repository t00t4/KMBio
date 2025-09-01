# Database Setup

This directory contains the database schema and setup scripts for the KMBio MVP.

## Setup Instructions

### 1. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `setup.sql` into the SQL Editor
4. Run the script to create all necessary tables and policies

### 2. Environment Variables

Make sure your `.env` file contains the correct Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Verification

After running the setup script, you should see the following tables in your Supabase database:

- `vehicles` - Stores vehicle information
- `trips` - Stores trip data
- `trip_events` - Stores events that occur during trips
- `weekly_summaries` - Stores aggregated weekly data
- `tips` - Stores AI-generated tips for users

### 4. Row Level Security (RLS)

The setup script automatically enables Row Level Security on all tables and creates policies to ensure users can only access their own data.

## Schema Overview

### Vehicles Table

Stores information about user vehicles including:
- Basic info (name, make, model, year)
- Engine specifications (fuel type, engine size)
- OBD-II capabilities (supported PIDs)
- Active status (which vehicle is currently being used)

### Constraints

- Vehicle year must be between 1990 and current year + 1
- Engine size must be between 0 and 10 liters
- Fuel type must be one of: gasoline, ethanol, diesel, flex
- Only one vehicle per user can be active at a time (enforced by application logic)

### Indexes

Performance indexes are created for:
- User-based queries
- Active vehicle lookups
- Trip history queries
- Time-based queries

## Development Notes

- The `auth.users` table is managed by Supabase Auth and doesn't need to be created manually
- All foreign keys reference `auth.users(id)` for user relationships
- Timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- JSON fields use `JSONB` for better performance and querying capabilities