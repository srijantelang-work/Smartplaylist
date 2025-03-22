import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function HomePage() {
  const { user } = useAuth();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Background GIF loaded successfully');
      setBackgroundLoaded(true);
      setBackgroundError(false);
    };
    img.onerror = (e) => {
      console.error('Error loading background GIF:', e);
      setBackgroundError(true);
      if (img.src.startsWith('/')) {
        img.src = 'dj-ring.jpeg';
      } else {
        img.src = '/dj-ring.jpeg';
      }
    };
    
    img.src = 'fxVE.gif';

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Animated Background Container */}
        <div className="relative w-[800px] h-[800px] max-w-[90vw] max-h-[90vh] my-auto">
          {/* Animated Background */}
          <div 
            className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
              backgroundLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${backgroundError ? 'dj-ring.jpeg' : 'fxVE.gif'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(0.8)',
            }}
          />
          
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 rounded-full bg-black/30" />
          
          {/* Fallback Background */}
          {!backgroundLoaded && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                backgroundImage: "url('/dj-ring.jpeg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(0.8)',
              }}
            />
          )}
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]">
              SMARTPLAYLIST
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white max-w-xl mx-auto drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
              Create personalized playlists that match your mood, powered by artificial intelligence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link
                  to="/create-playlist"
                  className="w-full sm:w-auto bg-[#1DB954] text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition backdrop-blur-sm"
                >
                  Create Playlist
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/signup"
                    className="w-full sm:w-auto bg-[#1DB954] text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition backdrop-blur-sm"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/auth/login"
                    className="w-full sm:w-auto border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition backdrop-blur-sm bg-black/20"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#000000]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose <span className="text-[#1DB954]">SmartPlaylist</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#323232] p-6 rounded-lg hover:transform hover:-translate-y-1 transition"
              >
                <div className="text-[#1DB954] text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[#E8E8E8]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-black to-[#323232]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It <span className="text-[#1DB954]">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-[#E8E8E8]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#323232]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Benefits & <span className="text-[#1DB954]">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-6 items-start hover:transform hover:-translate-y-1 transition"
              >
                <div className="text-[#1DB954] text-3xl flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-[#E8E8E8]">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Create Your Perfect Playlist?
          </h2>
          <p className="text-xl text-[#E8E8E8] mb-8 max-w-2xl mx-auto">
            Join thousands of music lovers who are discovering their next favorite playlist
          </p>
          {!user && (
            <Link
              to="/auth/signup"
              className="bg-[#1DB954] text-white px-12 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 transition inline-block"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: '🎯',
    title: 'AI-Powered Recommendations',
    description: 'Advanced AI algorithms analyze your music taste to create perfectly tailored playlists',
  },
  {
    icon: '🎵',
    title: 'Mood-Based Generation',
    description: "Generate playlists based on your current mood or the vibe you're looking for",
  },
  {
    icon: '⚡',
    title: 'Instant Creation',
    description: 'Create the perfect playlist in seconds with our advanced AI technology',
  },
];

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your account and set your music preferences',
  },
  {
    title: 'Describe Your Mood',
    description: 'Tell us what kind of playlist you want',
  },
  {
    title: 'AI Generation',
    description: 'Our AI creates your personalized playlist',
  },
  {
    title: 'Enjoy & Share',
    description: 'Listen to your playlist and share with friends',
  },
];

const benefits = [
  {
    icon: '🎨',
    title: 'Personalized Experience',
    description: 'Every playlist is uniquely crafted based on your preferences and listening history',
  },
  {
    icon: '🔄',
    title: 'Regular Updates',
    description: 'Playlists evolve with your taste and new music discoveries',
  },
  {
    icon: '🌐',
    title: 'Cross-Platform Integration',
    description: 'Seamlessly connect with your favorite music streaming services',
  },
  {
    icon: '🤝',
    title: 'Community Features',
    description: 'Share and discover playlists from like-minded music lovers',
  },
]; 