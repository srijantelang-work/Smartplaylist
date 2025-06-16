export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Domain Ownership and Service Provider</h2>
            <p className="mb-4">
              This Privacy Policy applies to the SmartPlaylist service operated at smartplaylist.vercel.app, which is owned and operated by SmartPlaylist ("we", "us", or "our"). This domain and all associated services are under our direct control and ownership.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="mb-4">
              When you use SmartPlaylist, we collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email address, name) through Google Sign-In</li>
              <li>Google account public profile information (as authorized by you)</li>
              <li>Spotify account connection data (when enabled)</li>
              <li>Playlist preferences and music taste data</li>
              <li>Usage data and interaction with our services</li>
              <li>Device information and IP addresses for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. OAuth Authentication</h2>
            <p className="mb-4">
              Our service uses Google OAuth for authentication. This process involves:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Requesting only essential permissions needed for authentication</li>
              <li>Accessing basic profile information to create and manage your account</li>
              <li>Storing authentication tokens securely</li>
              <li>Regular security audits of our authentication system</li>
              <li>No access to your Google account beyond explicitly requested permissions</li>
            </ul>
            <p className="mt-4">
              You can review and revoke access to our application at any time through your{' '}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#1DB954] hover:underline"
              >
                Google Account settings
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authenticate your identity through Google Sign-In</li>
              <li>Create and maintain your account</li>
              <li>Provide and improve our playlist generation service</li>
              <li>Generate personalized music recommendations</li>
              <li>Communicate with you about our services</li>
              <li>Analyze usage patterns to optimize user experience</li>
              <li>Ensure the security of your account</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Protection and Security</h2>
            <p className="mb-4">
              We implement robust security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Secure authentication through Google OAuth 2.0</li>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication logging</li>
              <li>Secure data storage using industry-standard practices</li>
              <li>Regular backups and disaster recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Sharing and Third Parties</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers (hosting, analytics, security)</li>
              <li>Authentication providers (Google)</li>
              <li>Music service providers (Spotify, when enabled)</li>
              <li>Law enforcement when required by law</li>
            </ul>
            <p className="mt-4">
              All third-party services we use are bound by data processing agreements and privacy policies that protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Privacy Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of non-essential data collection</li>
              <li>Export your data in a portable format</li>
              <li>Revoke OAuth access permissions</li>
              <li>Lodge a complaint with supervisory authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information only for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="mt-4">
              You can request deletion of your account and associated data at any time through our application settings or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred and processed in countries other than your own. We ensure appropriate safeguards are in place through standard contractual clauses and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any material changes through our application or via email. Your continued use of our service after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
            <p className="mb-4">
              For questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none space-y-2">
              <li>Email: <a href="mailto:privacy@smartplaylist.com" className="text-[#1DB954] hover:underline">privacy@smartplaylist.com</a></li>
              <li>Address: workforsrijan27@gmail.com</li>
              <li>Data Protection Officer: Srijan</li>
            </ul>
          </section>

          <div className="text-sm text-gray-400 mt-12 space-y-2">
            <p>Effective Date: {new Date().toLocaleDateString()}</p>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
            <p>Document Version: 1.1</p>
          </div>
        </div>
      </div>
    </div>
  );
} 