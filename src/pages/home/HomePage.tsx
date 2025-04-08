import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import backgroundGif from '../../assets/images/fxVE.gif';

export function HomePage() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Music note symbols
    const musicSymbols = ['♪', '♫', '𝄞', '♩', '𝅘𝅥𝅮', '𝅗𝅥'];
    
    // Particles for both notes and constellation points
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      symbol?: string;
      opacity: number;
      isNote: boolean;
      velocityX: number;
      velocityY: number;
    }> = [];

    // Initialize particles
    const particleCount = 40;
    const constellationCount = 30;

    // Add music notes
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: 14 + Math.random() * 10,
        speed: 0.5 + Math.random() * 1,
        symbol: musicSymbols[Math.floor(Math.random() * musicSymbols.length)],
        opacity: 0.1 + Math.random() * 0.5,
        isNote: true,
        velocityX: (Math.random() - 0.5) * 0.5,
        velocityY: -0.5 - Math.random() * 0.5
      });
    }

    // Add constellation points
    for (let i = 0; i < constellationCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: 2,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.4 + Math.random() * 0.3,
        isNote: false,
        velocityX: (Math.random() - 0.5) * 0.3,
        velocityY: (Math.random() - 0.5) * 0.3
      });
    }

    // Draw constellation lines between points
    const drawConstellationLines = () => {
      const maxDistance = 150;
      const points = particles.filter(p => !p.isNote);

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.2;
            ctx.strokeStyle = `rgba(29, 185, 84, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        // Reset position if out of bounds
        if (particle.y < -50) particle.y = canvas.offsetHeight + 50;
        if (particle.y > canvas.offsetHeight + 50) particle.y = -50;
        if (particle.x < -50) particle.x = canvas.offsetWidth + 50;
        if (particle.x > canvas.offsetWidth + 50) particle.x = -50;

        // Draw particle
        if (particle.isNote) {
          // Draw music note
          ctx.font = `${particle.size}px Arial`;
          ctx.fillStyle = `rgba(29, 185, 84, ${particle.opacity})`;
          ctx.fillText(particle.symbol!, particle.x, particle.y);
        } else {
          // Draw constellation point
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(29, 185, 84, ${particle.opacity})`;
          ctx.fill();
        }
      });

      // Draw constellation lines
      drawConstellationLines();

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animation Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.8 }}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-50" />
        
        {/* Content Container */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Title with refined typography */}
          <div className="relative mb-8">
            <h1 className="text-5xl md:text-8xl font-thin mb-2 text-white tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/80 font-display">
              SMART<span className="font-thin text-[#1DB954]">PLAYLIST</span>
            </h1>
            {/* Subtle line accent */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-[1px] bg-[#1DB954]/30" />
          </div>

          {/* Subtitle with refined typography */}
          <p className="text-lg md:text-2xl mb-12 text-white/80 max-w-xl mx-auto animate-fade-in-delay font-light leading-relaxed tracking-[0.15em]">
            Create personalized playlists that match your mood,{' '}
            <span className="text-[#1DB954]/90">powered by artificial intelligence</span>
          </p>

          {/* Buttons with refined styling */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            {user ? (
              <Link
                to="/create-playlist"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-[25px] text-base overflow-hidden transition-all duration-300 hover:rounded-[20px] music-note-click"
                onClick={(e) => {
                  const notes = ['♪', '♫', '♬', '♩', '𝄞'];
                  for (let i = 0; i < 6; i++) {
                    const note = document.createElement('span');
                    note.innerText = notes[Math.floor(Math.random() * notes.length)];
                    note.className = 'music-note absolute text-[#1DB954] text-xl';
                    note.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left}px`;
                    note.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top}px`;
                    e.currentTarget.appendChild(note);
                    setTimeout(() => note.remove(), 1000);
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] via-[#23e025] to-[#1DB954] bg-[length:200%_100%] animate-gradient-x opacity-90 group-hover:opacity-100 rounded-[25px] group-hover:rounded-[20px] transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300 rounded-[25px] group-hover:rounded-[20px]" />
                <span className="relative z-10 font-medium tracking-wide text-white flex items-center gap-2">
                  Create Playlist
                  <svg className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1DB954]/20 via-[#23e025]/20 to-[#1DB954]/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[25px] group-hover:rounded-[20px]" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signup"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-[25px] text-base overflow-hidden transition-all duration-300 hover:rounded-[20px] music-note-click"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] via-[#23e025] to-[#1DB954] bg-[length:200%_100%] animate-gradient-x opacity-90 group-hover:opacity-100 rounded-[25px] group-hover:rounded-[20px] transition-all duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300 rounded-[25px] group-hover:rounded-[20px]" />
                  <span className="relative z-10 font-medium tracking-wide text-white flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1DB954]/20 via-[#23e025]/20 to-[#1DB954]/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[25px] group-hover:rounded-[20px]" />
                </Link>
                <Link
                  to="/auth/login"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-[25px] text-base overflow-hidden transition-all duration-300 bg-black/20 hover:bg-black/40 border border-white/10 hover:border-white/20 music-note-click"
                  onClick={(e) => {
                    const notes = ['♪', '♫', '♬', '♩', '𝄞'];
                    for (let i = 0; i < 6; i++) {
                      const note = document.createElement('span');
                      note.innerText = notes[Math.floor(Math.random() * notes.length)];
                      note.className = 'music-note absolute text-[#1DB954] text-xl';
                      note.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left}px`;
                      note.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top}px`;
                      e.currentTarget.appendChild(note);
                      setTimeout(() => note.remove(), 1000);
                    }
                  }}
                >
                  <span className="relative z-10 font-medium tracking-wide text-white/90 group-hover:text-white transition-colors duration-300">Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-thin text-center mb-8 tracking-[0.15em]">
            See <span className="text-[#1DB954] font-thin">SmartPlaylist</span> in Action
          </h2>
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
            <video
              className="w-full aspect-video"
              controls
              poster="/video-thumbnail.jpg"
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-center text-[#E8E8E8] mt-6 max-w-2xl mx-auto font-extralight tracking-wider">
            Watch how easy it is to create AI-powered playlists tailored to your mood and preferences.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#000000] relative overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(29, 185, 84, 0.1) 0%, transparent 50%)',
            animation: 'pulse 8s ease-in-out infinite'
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-thin text-center mb-16 tracking-[0.15em]">
            Why Choose <span className="text-[#1DB954] font-thin">SmartPlaylist</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.2}s forwards`,
                  opacity: 0
                }}
              >
                {/* Card Background with Glassmorphism */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl" />
                <div className="absolute inset-0 backdrop-blur-sm bg-black/20 rounded-2xl" />
                
                {/* Card Content */}
                <div className="relative p-8 h-full flex flex-col items-center text-center transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                  {/* Icon Container with Animation */}
                  <div className="relative mb-6">
                    {/* Animated ring */}
                    <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                    <div className="relative w-16 h-16 flex items-center justify-center bg-[#1DB954]/10 rounded-full transform transition-transform duration-500 group-hover:scale-110">
                      <span className="text-4xl transform transition-transform duration-500 group-hover:scale-110">
                        {feature.icon}
                      </span>
                    </div>
                  </div>

                  {/* Title with hover effect */}
                  <h3 className="text-xl font-extralight mb-4 text-white group-hover:text-[#1DB954] transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description with fade in effect */}
                  <p className="text-[#E8E8E8] text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-300 font-extralight tracking-wider">
                    {feature.description}
                  </p>

                  {/* Hover border effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#1DB954]/30 transition-colors duration-500" />
                  
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-transparent group-hover:border-[#1DB954] rounded-tl-2xl transition-colors duration-500" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-transparent group-hover:border-[#1DB954] rounded-br-2xl transition-colors duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add animations */}
        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.5;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.3;
              }
            }
          `}
        </style>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-black to-[#323232] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
            backgroundSize: '100px 100px'
          }}/>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-thin text-center mb-24 tracking-[0.15em]">
            How It <span className="text-[#1DB954] font-thin">Works</span>
          </h2>

          <div className="max-w-6xl mx-auto space-y-32">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-12 ${
                  index % 2 === 0 ? '' : 'flex-row-reverse'
                } opacity-0 transform ${
                  index % 2 === 0 ? 'translate-x-[-50px]' : 'translate-x-[50px]'
                }`}
                style={{
                  animation: `fadeSlide 0.8s ease-out ${index * 0.2}s forwards`
                }}
              >
                {/* Step Number and Content */}
                <div className="flex-1 group">
                  <div className="relative">
                    <div className="absolute -left-4 -top-4 text-8xl font-extralight text-[#1DB954] opacity-10 group-hover:scale-110 transition-transform duration-500">
                      {index + 1}
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl font-extralight mb-6 text-white group-hover:text-[#1DB954] transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-[#E8E8E8] text-lg leading-relaxed font-extralight tracking-wider">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Container */}
                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#1DB954] opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"/>
                    <div className="transform group-hover:scale-[1.02] transition-transform duration-500">
                      <div className="relative rounded-xl overflow-hidden shadow-2xl">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full aspect-[16/9] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Line (if not last item) */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute left-1/2 bottom-[-120px] h-[60px] w-px bg-gradient-to-b from-[#1DB954] to-transparent`}
                    style={{
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add animation keyframes */}
      <style>
        {`
          @keyframes fadeSlide {
            from {
              opacity: 0;
              transform: translateX(var(--translate-x, 0));
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

      {/* Benefits Section */}
      <section className="py-20 bg-[#121212] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-thin text-center mb-16 tracking-[0.15em]">
            Benefits & <span className="text-[#1DB954] font-thin">Features</span>
          </h2>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.15}s forwards`,
                  opacity: 0
                }}
              >
                <div className="flex items-start gap-6">
                  {/* Icon Container */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center group-hover:bg-[#1DB954]/20 transition-colors duration-300">
                      <span className="text-2xl text-[#1DB954]">
                        {benefit.icon}
                      </span>
                    </div>
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-full bg-[#1DB954]/5 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h3 className="text-xl font-extralight mb-2 text-white group-hover:text-[#1DB954] transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-[#E8E8E8] text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-300 font-extralight tracking-wider">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add animations */}
        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-thin mb-6 tracking-[0.15em] text-center">
            Ready to Create Your Perfect Playlist?
          </h2>
          <p className="text-xl text-[#E8E8E8] mb-8 max-w-2xl mx-auto font-light tracking-[0.1em] leading-relaxed">
            Join thousands of music lovers who are discovering their next favorite playlist
          </p>
          {!user && (
            <Link
              to="/auth/signup"
              className="bg-[#1DB954] text-white px-12 py-4 rounded-full font-extralight text-lg hover:bg-opacity-90 transition inline-block tracking-wide"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </section>

      {/* Add animations */}
      <style>
        {`
          @keyframes orb-rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes orb-pulse {
            0%, 100% {
              opacity: 0.5;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.05);
            }
          }

          @keyframes orbit {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(10px, -10px);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-orb-rotate {
            animation: orb-rotate 20s linear infinite;
          }

          .animate-orb-pulse {
            animation: orb-pulse 4s ease-in-out infinite;
          }

          .animate-orbit-slow {
            animation: orbit 30s linear infinite;
          }

          .animate-orbit-slower {
            animation: orbit 40s linear infinite reverse;
          }

          .animate-float {
            animation: float 5s ease-in-out infinite;
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
          }

          .animate-fade-in-delay {
            animation: fade-in 1s ease-out 0.2s forwards;
            opacity: 0;
          }

          .animate-fade-in-delay-2 {
            animation: fade-in 1s ease-out 0.4s forwards;
            opacity: 0;
          }

          @keyframes gradient-x {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.8;
            }
          }

          .animate-gradient-x {
            background-size: 200% 100%;
            animation: gradient-x 15s linear infinite;
          }

          .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }

          .music-note-click {
            position: relative;
            overflow: visible !important;
          }

          .music-note {
            pointer-events: none;
            animation: float-note 1s ease-out forwards;
            will-change: transform, opacity;
          }

          @keyframes float-note {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate(
                calc(${Math.random() < 0.5 ? '-' : ''}${Math.random() * 100}px),
                -100px
              ) rotate(${Math.random() * 360}deg);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

const features = [
  {
    icon: '��',
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
    image: '/loginpage.jpeg'
  },
  
  {
    title: 'Explore Homepage',
    description: 'Browse through our features and discover what we offer',
    image: '/homepage.jpg'
  },
  {
    title: 'Create Playlist',
    description: 'Tell us what kind of playlist you want',
    image: '/create-playlist.jpeg'
  },
  {
    title: 'AI Generation',
    description: 'Our AI creates your personalized playlist',
    image: '/playlist-result.jpeg'
  },
  {
    title: 'Export & Share',
    description: 'Export to Spotify and share with friends (YouTube export coming soon!)',
    image: '/export.jpeg'
  }
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