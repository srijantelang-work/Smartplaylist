import express from 'express';
import cors from 'cors';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Supabase client for auth
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://smartplaylist.vercel.app',
      'https://smartplaylist.vercel.app/',
      process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
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
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
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
           Do not include any explanatory text, only return the JSON array.`,
      temperature: typeof options.temperature === 'number' ? Math.min(Math.max(options.temperature, 0), 1) : 0.7,
      maxTokens: typeof options.maxTokens === 'number' ? Math.min(Math.max(options.maxTokens, 100), 4000) : 4000,
    };

    // Enhance the user prompt to ensure JSON output
    const enhancedPrompt = `Generate a playlist based on this request: "${prompt}"
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