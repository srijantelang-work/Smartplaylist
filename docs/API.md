# SmartPlaylist API Documentation

## Base URL

- Development: `http://localhost:3001`
- Production: `https://smartplaylist.vercel.app/api`

## Authentication

All API endpoints require authentication using a Supabase JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

## Endpoints

### Generate Playlist

Generate a new playlist based on a text prompt.

**Endpoint:** `POST /api/playlist/generate`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-supabase-jwt-token>
```

**Request Body:**
```json
{
  "prompt": "string",
  "options": {
    "systemPrompt": "string (optional)",
    "temperature": "number (0-1, optional, default: 0.7)",
    "maxTokens": "number (100-4000, optional, default: 4000)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "string",
      "artist": "string",
      "album": "string (optional)",
      "year": "number (optional)"
    }
  ],
  "message": "string"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string",
  "details": "object (in development mode only)"
}
```

### Analyze Audio

Analyze audio features of a song.

**Endpoint:** `POST /api/audio/analyze`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-supabase-jwt-token>
```

**Request Body:**
```json
{
  "audioUrl": "string"
}
```

**Response:**
```json
{
  "bpm": "number",
  "key": "string",
  "mode": "number (0 for minor, 1 for major)",
  "danceability": "number (0-1)",
  "energy": "number (0-1)",
  "acousticness": "number (0-1)",
  "instrumentalness": "number (0-1)",
  "valence": "number (0-1)"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

## Error Codes

- `400`: Bad Request - Invalid input parameters
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Valid authentication but insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

- Playlist Generation: 60 requests per hour per user
- Audio Analysis: 100 requests per hour per user

## Models

### Playlist Object
```typescript
interface Playlist {
  title: string;
  artist: string;
  album?: string;
  year?: number;
}
```

### Audio Features Object
```typescript
interface AudioFeatures {
  bpm: number;
  key: string;
  mode: 0 | 1;
  danceability: number;
  energy: number;
  acousticness: number;
  instrumentalness: number;
  valence: number;
}
```

## AI Model

The API uses Groq's `llama-3.3-70b-versatile` model for both playlist generation and audio analysis. The model is configured with:

- Default temperature: 0.7 (playlist generation)
- Default temperature: 0.3 (audio analysis)
- Maximum tokens: 4000 (playlist generation)
- Maximum tokens: 200 (audio analysis)

## Examples

### Generate a Playlist

```bash
curl -X POST "http://localhost:3001/api/playlist/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "Create a relaxing jazz playlist for studying",
    "options": {
      "temperature": 0.7,
      "maxTokens": 4000
    }
  }'
```

### Analyze Audio

```bash
curl -X POST "http://localhost:3001/api/audio/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "audioUrl": "https://example.com/song.mp3"
  }'
```

## Development Guidelines

1. Always validate input parameters
2. Include appropriate error handling
3. Use TypeScript interfaces for type safety
4. Follow RESTful conventions
5. Include proper CORS headers
6. Implement rate limiting
7. Log errors and important events
8. Use environment variables for configuration 