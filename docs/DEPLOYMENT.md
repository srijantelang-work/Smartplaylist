# Deployment Guide

This guide covers the deployment process for both the frontend and backend components of SmartPlaylist.

## Frontend Deployment (Vercel)

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. The [Vercel CLI](https://vercel.com/cli) installed:
   ```bash
   npm install -g vercel
   ```

### Steps

1. **Prepare Your Application**

   Ensure your `.env` file contains all required variables:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_URL=https://your-domain.vercel.app
   VITE_API_URL=https://your-api-domain.vercel.app
   ```

2. **Configure Vercel**

   Create or update `vercel.json` in your project root:
   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "routes": [
       {
         "src": "/assets/.*\\.(js|mjs)",
         "headers": {
           "content-type": "application/javascript",
           "cache-control": "public, max-age=31536000, immutable"
         },
         "continue": true
       },
       {
         "src": "/assets/.*\\.css",
         "headers": {
           "content-type": "text/css",
           "cache-control": "public, max-age=31536000, immutable"
         },
         "continue": true
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

3. **Deploy**

   ```bash
   # Login to Vercel
   vercel login

   # Deploy
   vercel

   # For production deployment
   vercel --prod
   ```

4. **Configure Environment Variables**

   In the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from your `.env` file

5. **Configure Domain (Optional)**

   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain

## Backend Deployment (Vercel)

### Prerequisites

1. A Vercel account
2. The Vercel CLI installed
3. A Supabase project
4. A Groq API key

### Steps

1. **Prepare Your Server**

   Ensure your `server/.env` file contains:
   ```env
   PORT=3001
   NODE_ENV=production
   GROQ_API_KEY=your-groq-api-key
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Configure Vercel**

   Create or update `server/vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js",
         "headers": {
           "Access-Control-Allow-Origin": "https://your-frontend-domain.vercel.app",
           "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
           "Access-Control-Allow-Headers": "Content-Type, Authorization"
         }
       }
     ]
   }
   ```

3. **Build the Server**

   ```bash
   cd server
   npm run build
   ```

4. **Deploy**

   ```bash
   # From the server directory
   vercel

   # For production
   vercel --prod
   ```

5. **Configure Environment Variables**

   In the Vercel dashboard:
   - Go to your server project settings
   - Navigate to "Environment Variables"
   - Add all variables from your `server/.env` file

## Database Setup (Supabase)

1. **Create Tables**

   Execute these SQL commands in Supabase SQL editor:

   ```sql
   -- Create playlists table
   CREATE TABLE playlists (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     name TEXT NOT NULL,
     description TEXT,
     prompt TEXT,
     mood TEXT,
     is_public BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create songs table
   CREATE TABLE songs (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     artist TEXT NOT NULL,
     album TEXT,
     year INTEGER,
     duration INTEGER,
     bpm INTEGER,
     key TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create RLS policies
   ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
   ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

   -- Playlist policies
   CREATE POLICY "Users can view their own playlists"
     ON playlists FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can create their own playlists"
     ON playlists FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- Song policies
   CREATE POLICY "Users can view songs in their playlists"
     ON songs FOR SELECT
     USING (EXISTS (
       SELECT 1 FROM playlists
       WHERE playlists.id = songs.playlist_id
       AND playlists.user_id = auth.uid()
     ));

   CREATE POLICY "Users can add songs to their playlists"
     ON songs FOR INSERT
     WITH CHECK (EXISTS (
       SELECT 1 FROM playlists
       WHERE playlists.id = songs.playlist_id
       AND playlists.user_id = auth.uid()
     ));
   ```

2. **Configure Auth**

   In Supabase dashboard:
   - Enable Email auth provider
   - Configure password policy
   - Set up email templates

## Post-Deployment Checklist

1. **Verify Frontend**
   - Test authentication flow
   - Verify API connections
   - Check asset loading
   - Test responsive design

2. **Verify Backend**
   - Test API endpoints
   - Verify CORS settings
   - Check environment variables
   - Test rate limiting

3. **Monitor**
   - Set up error tracking
   - Configure logging
   - Monitor API usage
   - Check performance metrics

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify CORS configuration in `server/index.ts`
   - Check frontend URL in backend environment variables
   - Ensure proper headers in Vercel configuration

2. **Module Loading Errors**
   - Check MIME types in Vercel configuration
   - Verify build output
   - Check import paths

3. **Authentication Issues**
   - Verify Supabase configuration
   - Check JWT token handling
   - Validate environment variables

4. **Build Failures**
   - Check Node.js version
   - Verify dependencies
   - Check build scripts

### Getting Help

- Check [Vercel Documentation](https://vercel.com/docs)
- Visit [Supabase Documentation](https://supabase.com/docs)
- Join [Groq Discord](https://discord.gg/groq)
- Open an issue in the repository 