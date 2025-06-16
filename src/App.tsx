import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthCallback from './pages/auth/AuthCallback';
import { LoginPage } from './pages/auth/LoginPage';
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
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SignOutPage } from './pages/auth/SignOutPage';

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
  // Verify authentication state on app load
  useEffect(() => {
    const verifyAuthState = async () => {
      try {
        // Check if there's a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        // If URL contains sign-out parameter, force sign out
        if (window.location.search.includes('sign-out=true') && session) {
          await supabase.auth.signOut();
          window.location.replace('/');
        }
      } catch (error) {
        console.error('Error verifying auth state:', error);
      }
    };
    
    verifyAuthState();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <div className="min-h-screen bg-[var(--dark-background)] flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/signout" element={<SignOutPage />} />
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
