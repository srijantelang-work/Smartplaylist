import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthPage } from './pages/auth/AuthPage';
import { AuthCallback } from './pages/auth/AuthCallback';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { CreatePlaylistPage } from './pages/create-playlist/CreatePlaylistPage';
import { PlaylistResultPage } from './pages/playlist-result/PlaylistResultPage';
import './App.css'
import { AppProvider } from './contexts/AppContext';
import { Navbar } from './components/navigation/Navbar';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HomePage } from './pages/home/HomePage';
import { MyPlaylistsPage } from './pages/my-playlists/MyPlaylistsPage';
import { Footer } from './components/layout/Footer';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsAndConditions } from './pages/legal/TermsAndConditions';

// Simple NotFound component
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
    <h1 className="text-4xl font-bold mb-4 text-[var(--primary-color)]">404 - Page Not Found</h1>
    <p className="text-xl mb-8 text-[var(--text-color)]">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" className="px-6 py-3 bg-[var(--primary-color)] text-white rounded-lg hover:bg-opacity-90 transition-all">
      Go Home
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <div className="min-h-screen bg-[var(--dark-background)] flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />}>
                  <Route path="login" element={<LoginPage />} />
                  <Route path="signup" element={<SignupPage />} />
                </Route>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/create-playlist" element={<CreatePlaylistPage />} />
                <Route path="/playlist-result/:id" element={<PlaylistResultPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/my-playlists" element={<MyPlaylistsPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                {/* Add catch-all route for 404 errors */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App
