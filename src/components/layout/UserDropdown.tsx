import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#323232] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-white font-medium">
          {user.user_metadata.full_name?.[0] || user.email?.[0] || 'U'}
        </div>
        <span className="text-[#E8E8E8] hidden md:block">
          {user.user_metadata.full_name || user.email}
        </span>
        <svg
          className={`w-5 h-5 text-[#E8E8E8] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#323232] shadow-lg py-1 z-50">
          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-[#E8E8E8] hover:bg-[#1DB954] hover:text-white"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-[#E8E8E8] hover:bg-[#1DB954] hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 