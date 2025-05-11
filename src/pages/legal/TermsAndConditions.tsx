export function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
        
        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SmartPlaylist, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
            <p className="mb-4">
              SmartPlaylist is a web application that creates personalized music playlists using artificial intelligence. Our service integrates with Spotify to provide playlist generation and management capabilities.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Authentication and Account Access</h2>
            <p className="mb-4">Our service uses Google Sign-In for authentication. By using this service, you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Agree to provide accurate Google account information</li>
              <li>Authorize us to access your basic Google profile information</li>
              <li>Understand that you can revoke access through your Google Account settings</li>
              <li>Accept Google's terms of service and privacy policy</li>
              <li>Acknowledge that account access depends on Google's authentication services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Accounts</h2>
            <p className="mb-4">By creating an account, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not share your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Use only one Google account per SmartPlaylist account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p className="mb-4">
              All content, features, and functionality of SmartPlaylist, including but not limited to text, graphics, logos, and software, are owned by SmartPlaylist and are protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Abuse or manipulate the authentication system</li>
              <li>Create multiple accounts for malicious purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Third-Party Services</h2>
            <p className="mb-4">
              Our service integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Sign-In for authentication</li>
              <li>Spotify for music services</li>
              <li>Other service providers for functionality and analytics</li>
            </ul>
            <p className="mt-4">
              Your use of these services is subject to their respective terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Account Termination</h2>
            <p className="mb-4">
              We reserve the right to terminate or suspend your account if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You violate these Terms and Conditions</li>
              <li>Your Google account access is revoked or terminated</li>
              <li>We detect suspicious or fraudulent activity</li>
              <li>You request account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              SmartPlaylist is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of our service, including any issues related to third-party authentication services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p>
              We may update these Terms and Conditions at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify you of significant changes via email or service notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms and Conditions, please contact us at{' '}
              <a href="mailto:support@smartplaylist.com" className="text-[#1DB954] hover:underline">
                support@smartplaylist.com
              </a>
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