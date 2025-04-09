/** @jsxImportSource react */
import { useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ProfileSettings } from './components/ProfileSettings';
import { Link } from 'react-router-dom';

type SettingsTab = 'profile' | 'privacy' | 'terms';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs: { id: SettingsTab; label: string; icon: React.ReactElement }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2 tracking-wide">Settings</h1>
            <p className="text-[#E8E8E8] font-light tracking-wide">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-8">
            {/* Sidebar Navigation */}
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-light tracking-wide ${
                    activeTab === tab.id
                      ? 'bg-[#1DB954] text-white'
                      : 'text-[#E8E8E8] hover:bg-[#323232]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Settings Content */}
            <div className="bg-[#323232] rounded-lg p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'privacy' && (
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-xl font-bold mb-4">Privacy Policy</h2>
                  <p className="text-[#E8E8E8] mb-4">
                    Our privacy policy outlines how we collect, use, and protect your personal information.
                  </p>
                  <Link
                    to="/privacy"
                    className="inline-block px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    View Privacy Policy
                  </Link>
                </div>
              )}
              {activeTab === 'terms' && (
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-xl font-bold mb-4">Terms & Conditions</h2>
                  <p className="text-[#E8E8E8] mb-4">
                    Please review our terms and conditions for using SmartPlaylist.
                  </p>
                  <Link
                    to="/terms"
                    className="inline-block px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    View Terms & Conditions
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 