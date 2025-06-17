-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_type') THEN
    CREATE TYPE mood_type AS ENUM (
      'happy',
      'sad',
      'energetic',
      'relaxed',
      'focused',
      'party',
      'workout',
      'chill'
    );
  END IF;
END
$$;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  preferred_genres TEXT[] DEFAULT '{}',
  favorite_artists TEXT[] DEFAULT '{}',
  preferred_bpm_min INTEGER CHECK (preferred_bpm_min >= 0),
  preferred_bpm_max INTEGER CHECK (preferred_bpm_max <= 300),
  preferred_moods mood_type[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT bpm_range_check CHECK (preferred_bpm_min <= preferred_bpm_max)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  mood mood_type,
  is_public BOOLEAN DEFAULT false,
  song_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in seconds
  cover_url TEXT,
  spotify_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER NOT NULL, -- in seconds
  year INTEGER,
  bpm INTEGER,
  key TEXT,
  spotify_id TEXT,
  youtube_id TEXT,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(playlist_id, spotify_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON public.users(spotify_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_spotify_id ON public.playlists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_songs_playlist_id ON public.songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON public.songs(spotify_id);
CREATE INDEX IF NOT EXISTS idx_songs_bpm ON public.songs(bpm);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read and update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.users FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON public.users FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- User preferences policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences'
  ) THEN
    CREATE POLICY "Users can view own preferences"
      ON public.user_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences'
  ) THEN
    CREATE POLICY "Users can update own preferences"
      ON public.user_preferences FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can create own preferences'
  ) THEN
    CREATE POLICY "Users can create own preferences"
      ON public.user_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Playlist policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playlists' AND policyname = 'Users can view public playlists'
  ) THEN
    CREATE POLICY "Users can view public playlists"
      ON public.playlists FOR SELECT
      USING (is_public OR auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playlists' AND policyname = 'Users can create own playlists'
  ) THEN
    CREATE POLICY "Users can create own playlists"
      ON public.playlists FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playlists' AND policyname = 'Users can update own playlists'
  ) THEN
    CREATE POLICY "Users can update own playlists"
      ON public.playlists FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'playlists' AND policyname = 'Users can delete own playlists'
  ) THEN
    CREATE POLICY "Users can delete own playlists"
      ON public.playlists FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Songs policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'songs' AND policyname = 'Users can view songs in accessible playlists'
  ) THEN
    CREATE POLICY "Users can view songs in accessible playlists"
      ON public.songs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.playlists
          WHERE id = songs.playlist_id
          AND (is_public OR user_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'songs' AND policyname = 'Users can manage songs in own playlists'
  ) THEN
    CREATE POLICY "Users can manage songs in own playlists"
      ON public.songs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.playlists
          WHERE id = songs.playlist_id
          AND user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_playlists_updated_at'
  ) THEN
    CREATE TRIGGER update_playlists_updated_at
      BEFORE UPDATE ON public.playlists
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$; 