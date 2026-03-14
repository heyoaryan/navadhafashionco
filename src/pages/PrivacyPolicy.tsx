import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO title="Privacy Policy | NAVADHA Fashion Co" description="Privacy Policy for NAVADHA Fashion Co" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-light" style={{ color: '#EE458F' }}>Privacy Policy</h1>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to NAVADHA Fashion Co ("we", "our", or "us"). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard
              your information when you visit our website or make a purchase from us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Name, email address, phone number, and billing/shipping address when you create an account or place an order</li>
              <li>Payment information (processed securely via Cashfree — we do not store card details)</li>
              <li>Profile preferences, saved addresses, and order history</li>
              <li>Communications you send us via contact forms or email</li>
              <li>Job application details if you apply for a position at NAVADHA</li>
            </ul>
            <p className="mt-3">We also automatically collect certain information when you use our website:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Device and browser information, IP address</li>
              <li>Pages visited, time spent, and browsing behavior on our site</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Process and fulfill your orders, including shipping and returns</li>
              <li>Send order confirmations, shipping updates, and delivery notifications</li>
              <li>Manage your account and provide customer support</li>
              <li>Personalize your shopping experience and recommend products</li>
              <li>Send promotional emails and offers (you can opt out anytime)</li>
              <li>Improve our website, products, and services through analytics</li>
              <li>Prevent fraud and ensure the security of our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Shipping and logistics partners to deliver your orders</li>
              <li>Payment processors (Cashfree) to handle transactions securely</li>
              <li>Cloud service providers (Supabase) for data storage and authentication</li>
              <li>Analytics providers to help us understand website usage</li>
              <li>Law enforcement or government authorities when required by law</li>
            </ul>
            <p className="mt-3">All third-party partners are bound by confidentiality agreements and are not permitted to use your data for their own purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, remember your preferences (such as cart items and
              wishlist), and analyze site traffic. You can control cookie settings through your browser. Disabling
              cookies may affect certain features of our website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including
              SSL encryption, secure authentication, and regular security audits. However, no method of
              transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, please contact us at <a href="mailto:privacy@navadha.com" className="text-pink-500 hover:text-pink-600 transition-colors">privacy@navadha.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Children's Privacy</h2>
            <p>
              Our website is not directed to children under the age of 13. We do not knowingly collect personal
              information from children. If you believe we have inadvertently collected such information, please
              contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new policy on this page with an updated date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please reach out to us:</p>
            <div className="mt-3 space-y-1">
              <p>NAVADHA Fashion Co</p>
              <p>Email: <a href="mailto:privacy@navadha.com" className="text-pink-500 hover:text-pink-600 transition-colors">privacy@navadha.com</a></p>
              <p>Website: <a href="/contact" className="text-pink-500 hover:text-pink-600 transition-colors">Contact Us</a></p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
