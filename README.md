# SmartPlaylist 🎵

An AI-powered playlist generation application that creates personalized music playlists based on natural language prompts.

## 🌟 Features

- **AI-Powered Playlist Generation**: Create custom playlists using natural language prompts
- **Audio Analysis**: Get detailed audio feature analysis for songs
- **Supabase Integration**: Secure authentication and data storage
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Spotify Integration**: Export playlists to Spotify (coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smartplaylist.git
cd smartplaylist
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Environment Setup:

Create a `.env` file in the root directory:
```env
# Frontend Environment Variables
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# Optional Feature Flags
VITE_ENABLE_SPOTIFY_INTEGRATION=false
VITE_ENABLE_YOUTUBE_INTEGRATION=false
```

Create a `.env` file in the server directory:
```env
PORT=3001
NODE_ENV=development
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:5173
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development servers:

```bash
# Start frontend (from root directory)
npm run dev

# Start backend (from server directory)
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
smartplaylist/
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API and service integrations
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── lib/           # Utility functions
│   └── styles/        # Global styles
├── server/            # Backend source code
│   ├── index.ts       # Main server file
│   └── types/         # Backend type definitions
├── public/            # Static assets
└── docs/             # Additional documentation
```

## 🔧 API Endpoints

### Playlist Generation
- **POST** `/api/playlist/generate`
  - Generates a playlist based on a text prompt
  - Requires authentication
  - Request body:
    ```json
    {
      "prompt": "Create a relaxing jazz playlist",
      "options": {
        "temperature": 0.7,
        "maxTokens": 4000
      }
    }
    ```

### Audio Analysis
- **POST** `/api/audio/analyze`
  - Analyzes audio features of a song
  - Requires authentication
  - Request body:
    ```json
    {
      "audioUrl": "https://example.com/song.mp3"
    }
    ```

## 🛠️ Technology Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Query
  - React Router
  - Framer Motion

- **Backend**:
  - Node.js
  - Express
  - TypeScript
  - Groq SDK (llama-3.3-70b-versatile model)
  - Supabase

- **Infrastructure**:
  - Vercel (Frontend & Backend deployment)
  - Supabase (Authentication & Database)

## 🔐 Security

- JWT-based authentication using Supabase
- CORS configuration with whitelisted origins
- Content Security Policy (CSP) headers
- Rate limiting on API endpoints
- Secure environment variable handling

## 🚢 Deployment

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy

### Backend Deployment (Vercel)

1. Ensure `vercel.json` is properly configured
2. Set up environment variables in Vercel dashboard
3. Deploy using Vercel CLI:
```bash
cd server
vercel
```

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

-Srijan Telang - Initial work - (https://github.com/Srijan272002)
-Sagnik Chowdhury - Initial work - (https://github.com/asapSAGNIK)

## 🙏 Acknowledgments

- [Groq](https://groq.com) for AI capabilities
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for hosting
- All contributors and supporters 
