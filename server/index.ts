import express from 'express';
import cors from 'cors';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { createClient, Session, User } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Supabase client for auth
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

// Add custom type definitions
declare global {
  namespace Express {
    interface Request {
      user?: User
      session?: Session
    }
  }
}

// Define allowed origins
const allowedOrigins = [
  'https://smartplaylist.software',
  'http://localhost:5173'
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, origin);
    } else {
      console.error('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'Authorization'
  ],
  exposedHeaders: ['Content-Length', 'X-Api-Version'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.json());

// Middleware to verify Supabase JWT
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization header',
        details: 'Authorization header is required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid authorization header format',
        details: 'Bearer token is required'
      });
    }

    // First verify the JWT is valid
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', {
        error: userError,
        token: token.substring(0, 10) + '...',
        timestamp: new Date().toISOString(),
        headers: req.headers
      });

      // Check if the error is due to an expired token
      if (userError.message?.includes('expired')) {
        return res.status(401).json({ 
          error: 'Token expired',
          details: 'Please refresh your session'
        });
      }

      return res.status(401).json({ 
        error: 'Invalid token',
        details: userError.message
      });
    }

    if (!user) {
      return res.status(401).json({ 
        error: 'No user found',
        details: 'Token validation succeeded but no user was found'
      });
    }

    // Verify JWT claims directly
    try {
      const { data: jwt, error: jwtError } = await supabase.auth.getUser(token);
      
      if (jwtError || !jwt.user) {
        console.error('JWT verification failed:', {
          error: jwtError,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ 
          error: 'Invalid token',
          details: jwtError?.message || 'JWT verification failed'
        });
      }

      // Create a mock session since we have a valid user and token
      const session = {
        access_token: token,
        user: jwt.user,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      // Add user and session to request
      req.user = user;
      req.session = session as Session;
      next();
    } catch (error) {
      console.error('Session verification error:', {
        error,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: 'Session verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Authentication error:', {
      error,
      timestamp: new Date().toISOString(),
      headers: req.headers,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Root route handler
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SmartPlaylist API is running',
    version: '1.0.0',
    endpoints: [
      {
        path: '/api/playlist/generate',
        method: 'POST',
        description: 'Generate a playlist based on a prompt',
        requiresAuth: true
      },
      {
        path: '/api/audio/analyze',
        method: 'POST',
        description: 'Analyze audio features',
        requiresAuth: true
      }
    ]
  });
});

// Development testing endpoint - NOT FOR PRODUCTION
if (process.env.NODE_ENV === 'development') {
  app.get('/api/playlist/generate', (req, res) => {
    res.json({
      message: 'This endpoint only accepts POST requests',
      howToUse: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_SUPABASE_TOKEN'
        },
        body: {
          prompt: 'Your playlist generation prompt',
          options: {
            // Optional configuration
          }
        }
      }
    });
  });
}

// Playlist generation endpoint
app.post('/api/playlist/generate', authenticateUser, async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid prompt. Must be a non-empty string.' 
      });
    }

    // Validate song count if provided in options
    if (options.songCount && (typeof options.songCount !== 'number' || options.songCount > 20)) {
      return res.status(400).json({
        error: 'Invalid song count. Maximum allowed is 20 songs.'
      });
    }

    // Sanitize and validate options
    const sanitizedOptions = {
      systemPrompt: typeof options.systemPrompt === 'string' 
        ? options.systemPrompt 
        : `You are a music expert AI. Your task is to generate playlists based on user prompts.
           Always respond with a valid JSON array of songs. Each song must have these properties:
           - title (string): The song title
           - artist (string): The artist name
           - album (string, optional): The album name
           - year (number, optional): Release year
           Important: Never generate more than 20 songs regardless of the request.
           Do not include any explanatory text, only return the JSON array.`,
      temperature: typeof options.temperature === 'number' ? Math.min(Math.max(options.temperature, 0), 1) : 0.7,
      maxTokens: typeof options.maxTokens === 'number' ? Math.min(Math.max(options.maxTokens, 100), 4000) : 4000,
    };

    // Enhance the user prompt to ensure JSON output and respect song limit
    const enhancedPrompt = `Generate a playlist based on this request: "${prompt}"
Generate no more than 20 songs total.
Format the response as a JSON array of songs with this structure:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "year": 2024
  }
]
Important: Return ONLY the JSON array, no other text.`;

    // Create completion with validated inputs
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: sanitizedOptions.systemPrompt
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: sanitizedOptions.temperature,
      max_tokens: sanitizedOptions.maxTokens,
      stop: ['}]'],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No suggestions generated');
    }

    // Log the raw response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Raw Groq response:', content);
    }

    // Try to parse the content as JSON to ensure it's valid
    try {
      const parsedContent = JSON.parse(content);
      
      // Validate the response structure
      if (!Array.isArray(parsedContent)) {
        throw new Error('Response must be an array of songs');
      }

      // Enforce 20 song limit
      if (parsedContent.length > 20) {
        parsedContent.splice(20); // Keep only first 20 songs
      }

      // Validate each song in the array
      const validatedContent = parsedContent.map(song => {
        if (typeof song !== 'object' || !song.title || !song.artist) {
          throw new Error('Each song must have at least a title and artist');
        }
        return {
          title: String(song.title),
          artist: String(song.artist),
          album: song.album ? String(song.album) : undefined,
          year: song.year ? Number(song.year) : undefined
        };
      });

      // Send the validated content directly without double stringifying
      res.json({
        success: true,
        data: validatedContent,
        message: 'Playlist generated successfully'
      });
    } catch (parseError) {
      console.error('Invalid JSON response:', parseError);
      console.error('Raw content:', content);
      res.status(500).json({ 
        success: false,
        error: 'Generated content is not valid JSON',
        details: process.env.NODE_ENV === 'development' ? {
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          content
        } : undefined
      });
    }
  } catch (error) {
    console.error('Error generating playlist:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      const statusCode = error.message.includes('Invalid prompt') ? 400 : 500;
      res.status(statusCode).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    } else {
      res.status(500).json({ 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
});

// Audio analysis endpoint
app.post('/api/audio/analyze', authenticateUser, async (req, res) => {
  try {
    const { audioUrl } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert music analyst AI. Analyze audio features and return them in a consistent JSON format.'
        },
        {
          role: 'user',
          content: `Analyze the audio features of this song: ${audioUrl}
Please provide the following features in JSON format:
{
  "bpm": number (tempo in beats per minute),
  "key": string (musical key, e.g., "C", "F#"),
  "mode": number (0 for minor, 1 for major),
  "danceability": number (0-1 scale),
  "energy": number (0-1 scale),
  "acousticness": number (0-1 scale),
  "instrumentalness": number (0-1 scale),
  "valence": number (0-1 scale)
}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No analysis generated');
    }

    // Ensure the response is valid JSON
    try {
      const parsedContent = JSON.parse(content);
      // Validate required fields
      const requiredFields = ['bpm', 'key', 'mode', 'danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];
      const missingFields = requiredFields.filter(field => !(field in parsedContent));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      res.json(parsedContent);
    } catch (parseError) {
      console.error('Error parsing analysis response:', parseError);
      res.status(500).json({ error: 'Invalid analysis format' });
    }
  } catch (error) {
    console.error('Error analyzing audio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to analyze audio'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 