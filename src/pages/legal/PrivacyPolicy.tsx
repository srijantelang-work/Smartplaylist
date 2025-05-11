export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              When you use SmartPlaylist, we collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email address, name) through Google Sign-In</li>
              <li>Google account public profile information (as authorized by you)</li>
              <li>Spotify account connection data</li>
              <li>Playlist preferences and music taste data</li>
              <li>Usage data and interaction with our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Authentication Services</h2>
            <p className="mb-4">
              We use Google Sign-In for authentication. When you sign in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We only request essential permissions needed for authentication</li>
              <li>We access basic profile information to create and manage your account</li>
              <li>We do not access your Google account beyond the explicitly requested permissions</li>
              <li>You can revoke access through your Google Account settings at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authenticate your identity through Google Sign-In</li>
              <li>Provide and improve our services</li>
              <li>Generate personalized playlist recommendations</li>
              <li>Communicate with you about our services</li>
              <li>Analyze usage patterns and optimize user experience</li>
              <li>Ensure security of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers (e.g., hosting, analytics)</li>
              <li>Authentication providers (Google)</li>
              <li>Third-party services you choose to connect (e.g., Spotify)</li>
              <li>When required by law or to protect rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Secure authentication through Google Sign-In</li>
              <li>Encryption of sensitive data</li>
              <li>Regular security audits</li>
              <li>Secure data storage practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Revoke Google Sign-In access</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@smartplaylist.com" className="text-[#1DB954] hover:underline">
                support@smartplaylist.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <p className="text-sm text-gray-400 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
} 