/** @jsxImportSource react */
import { useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ProfileSettings } from './components/ProfileSettings';
import { IntegrationSettings } from './components/IntegrationSettings';

type SettingsTab = 'profile' | 'integrations';

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
      id: 'integrations',
      label: 'Integrations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-[#E8E8E8]">
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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
              {activeTab === 'integrations' && <IntegrationSettings />}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 