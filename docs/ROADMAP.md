# SmartPlaylist 🎵

An AI-powered music playlist generator that creates personalized playlists based on your preferences, moods, and musical tastes.

![SmartPlaylist Demo](https://via.placeholder.com/800x400?text=SmartPlaylist+Demo)

## 🌟 Features

- **AI-Powered Recommendations**: Generate personalized playlists using Groq's advanced AI models
- **Intelligent Curation**: Create playlists based on mood, genre, activity, or any text prompt
- **User Profiles**: Save preferences and favorite genres for better recommendations
- **Playlist Management**: Create, edit, save, and share your playlists
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Secure Authentication**: User authentication powered by Supabase
- **Modern UI**: Beautiful interface built with React and Tailwind CSS

## 🚀 Live Demo

Check out the live application: [SmartPlaylist](https://smartplaylist.vercel.app/)

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom theming
- **State Management**: React Query
- **Backend & Auth**: Supabase (PostgreSQL + Auth)
- **AI Integration**: Groq API
- **Deployment**: Vercel
- **UI Components**: Material UI
- **Drag & Drop**: React DnD
- **Data Visualization**: Recharts
- **Testing**: Jest, React Testing Library, Playwright

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Supabase account
- Groq API key

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartplaylist.git
   cd smartplaylist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Groq Configuration
   VITE_GROQ_API_KEY=your-groq-api-key
   
   # Application URL
   VITE_APP_URL=http://localhost:5173
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` to see the application running.

## 📁 Project Structure

```
smartplaylist/
├── src/               # Source code
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   ├── lib/           # Utility functions and API clients
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles and theme configuration
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
├── dist/              # Build output (generated)
├── .vercel/           # Vercel configuration
├── supabase/          # Supabase configuration and migrations
├── tests/             # Test files
└── ... config files   # Various configuration files
```

## 🚢 Deployment

The application is configured for deployment on Vercel. See [DEPLOYMENT.md](./smartplaylist/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

## 🧪 Testing

Run the test suite:

```bash
# Unit and integration tests
npm test

# End-to-end tests
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please check out our [contributing guidelines](./smartplaylist/CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./smartplaylist/LICENSE) file for details.

## 🔮 Roadmap

See our [ROADMAP.md](./ROADMAP.md) for planned features and improvements.

## 🙏 Acknowledgments

- [Groq](https://groq.com) for AI capabilities
- [Supabase](https://supabase.com) for backend infrastructure
- [React](https://reactjs.org) and [Vite](https://vitejs.dev) teams
- [Tailwind CSS](https://tailwindcss.com) team
- All open-source contributors

## 📧 Contact

For questions or support, please open an issue on this repository or contact the maintainers.

---

<p align="center">Made with ❤️ by the SmartPlaylist team</p>

# SmartPlaylist Development Roadmap

## Phase 1: Project Setup and Infrastructure
- [ ] Initialize React project with Vite
- [ ] Set up Tailwind CSS configuration
- [ ] Configure Supabase backend
- [ ] Set up Groq API integration
- [ ] Create project repository and documentation
- [ ] Set up environment variables and configuration

## Phase 2: Backend Development
### Database Design
- [ ] Design user schema
- [ ] Design playlist schema
- [ ] Design song preferences schema
- [ ] Set up authentication with Supabase

### API Development
- [ ] Implement user management endpoints
- [ ] Create playlist generation endpoints
- [ ] Develop song recommendation algorithm using Groq
- [ ] Implement metadata analysis system
- [ ] Create API endpoints for playlist management

## Phase 3: Frontend Development
### Page Structure
- [ ] HomePage (/)
  - [ ] Landing/Welcome page design
  - [ ] Feature showcase section
  - [ ] Call-to-action buttons
  - [ ] Benefits and features overview
  - [ ] How it works section

- [ ] AuthPage (/auth)
  - [ ] Login form component
  - [ ] Registration form component
  - [ ] OAuth integration (Spotify/Google)
  - [ ] Form validation
  - [ ] Post-login redirect to create-playlist
  - [ ] Error handling and feedback

- [ ] CreatePlaylistPage (/create-playlist)
  - [ ] PlaylistForm component
    - [ ] Text prompt interface
    - [ ] Song count selector (5-50)
    - [ ] Genre preferences
    - [ ] Mood selection
  - [ ] Generation options panel
  - [ ] Loading/Generation states
  - [ ] Error handling
  - [ ] Preview component

- [ ] PlaylistResultPage (/playlist-result)
  - [ ] PlaylistHeader component
    - [ ] Playlist title and metadata
    - [ ] Export options (Spotify/YouTube)
    - [ ] Share functionality
  - [ ] PlaylistTable component
    - [ ] Song details (title, artist, album)
    - [ ] Audio metrics (BPM, duration, year)
    - [ ] Playback controls
    - [ ] Sorting and filtering
  - [ ] Export progress indicators
  - [ ] Success/Error notifications

- [ ] DashboardPage (/dashboard)
  - [ ] PlaylistGenerator component
  - [ ] User statistics display
    - [ ] Total playlists created
    - [ ] Favorite genres
    - [ ] Usage metrics
  - [ ] Recent activity feed
  - [ ] Quick actions panel
  - [ ] Recommendations section

- [ ] MyPlaylistsPage (/playlists)
  - [ ] PlaylistGrid component
  - [ ] Playlist cards with:
    - [ ] Playlist name and cover
    - [ ] Song count and duration
    - [ ] Mood/Genre tags
    - [ ] Creation date
    - [ ] Play/Export buttons
  - [ ] Sorting options
  - [ ] Filter by date/genre/mood
  - [ ] Search functionality
  - [ ] Pagination/Infinite scroll

- [ ] SettingsPage (/settings)
  - [ ] User profile management
  - [ ] Account preferences
  - [ ] Integration settings
    - [ ] Spotify connection
    - [ ] YouTube preferences
  - [ ] Notification settings
  - [ ] Privacy options

### Core Components
- [ ] Navigation
  - [ ] Sidebar/Header navigation
  - [ ] Mobile responsive menu
  - [ ] User dropdown
  - [ ] Breadcrumbs

- [ ] Layout
  - [ ] Responsive container system
  - [ ] Grid layouts
  - [ ] Component spacing
  - [ ] Loading states
  - [ ] Error boundaries

### User Experience Features
- [ ] Add responsive design
- [ ] Create loading states and animations
- [ ] Add error handling and user feedback
- [ ] Implement drag-and-drop functionality

## Phase 4: Music Platform Integration
- [ ] Implement Spotify API integration
  - [ ] Authentication
  - [ ] Playlist creation
  - [ ] Song search and metadata retrieval
- [ ] Implement YouTube API integration
  - [ ] Search functionality
  - [ ] Playlist creation
  - [ ] Video embedding

## Phase 5: AI and Recommendation Engine
- [ ] Develop core recommendation algorithm
- [ ] Implement BPM analysis
- [ ] Create genre classification system
- [ ] Add artist similarity detection
- [ ] Implement user preference learning

## Phase 6: Advanced Features
- [ ] Add playlist sharing functionality
- [ ] Implement collaborative playlists
- [ ] Create playlist export options
- [ ] Add advanced filtering options
  - [ ] BPM range selection
  - [ ] Genre mixing
  - [ ] Artist diversity control
- [ ] Implement playlist statistics and analytics

## Phase 7: Testing and Optimization
- [ ] Implement unit tests
- [ ] Perform integration testing
- [ ] Conduct user acceptance testing
- [ ] Optimize performance
- [ ] Security audit and improvements

## Phase 8: Deployment and Launch
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production environment
- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Implement analytics tracking

## Future Enhancements
- [ ] Mobile application development
- [ ] Advanced music analysis features
- [ ] Social features and community building
- [ ] Machine learning model improvements
- [ ] Additional platform integrations

## Timeline Estimates
- Phase 1: 1 week
- Phase 2: 2-3 weeks
- Phase 3: 2-3 weeks
- Phase 4: 1-2 weeks
- Phase 5: 2-3 weeks
- Phase 6: 2 weeks
- Phase 7: 1-2 weeks
- Phase 8: 1 week

Total estimated timeline: 12-17 weeks

## Success Metrics
- User engagement metrics
- Playlist generation accuracy
- User retention rate
- Platform integration success rate
- System performance metrics
- User satisfaction scores 