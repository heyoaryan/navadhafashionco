import SEO from '../components/SEO';

export default function TermsOfUse() {
  return (
    <>
      <SEO title="Terms of Use | NAVADHA Fashion Co" description="Read NAVADHA Fashion Co's terms of use. Understand the terms and conditions governing your use of our website and services." keywords="NAVADHA terms of use, terms and conditions, user agreement, shopping terms" url="https://navadha.com/terms" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-light" style={{ color: '#EE458F' }}>Terms of Use</h1>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the NAVADHA Fashion Co website, you agree to be bound by these Terms of Use.
              If you do not agree to these terms, please do not use our website. We reserve the right to update
              these terms at any time, and your continued use of the site constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Use of the Website</h2>
            <p>You agree to use our website only for lawful purposes. You must not:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the site in any way that violates applicable local, national, or international laws</li>
              <li>Attempt to gain unauthorized access to any part of our website or systems</li>
              <li>Transmit any unsolicited or unauthorized advertising or promotional material</li>
              <li>Impersonate any person or misrepresent your affiliation with any entity</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Account Registration</h2>
            <p>
              To place orders or access certain features, you may need to create an account. You are responsible
              for maintaining the confidentiality of your account credentials and for all activities that occur
              under your account. Please notify us immediately of any unauthorized use of your account.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms or engage in
              fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Orders and Payments</h2>
            <p>
              All orders placed on NAVADHA Fashion Co are subject to availability and acceptance. We reserve the
              right to refuse or cancel any order at our discretion. Prices are listed in Indian Rupees (₹) and
              are subject to change without notice.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Payments are processed securely via Razorpay payment gateway</li>
              <li>Free shipping is available on orders above ₹2,999</li>
              <li>Orders cannot be modified after payment confirmation</li>
              <li>We are not responsible for delays caused by incorrect shipping information provided by you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Returns and Refunds</h2>
            <p>
              We offer a 5-day easy return policy on eligible items. To be eligible for a return, items must be
              unused, unwashed, and in their original condition with all tags attached.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Return requests must be initiated within 5 days of delivery</li>
              <li>Customized or boutique-tailored items are not eligible for return</li>
              <li>Refunds will be processed to the original payment method within 7–10 business days</li>
              <li>We reserve the right to reject returns that do not meet our return conditions</li>
            </ul>
            <p className="mt-3">For full details, please visit our <a href="/returns" className="text-pink-500 hover:text-pink-600 transition-colors">Returns page</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Boutique & Customization</h2>
            <p>
              Our boutique customization service involves made-to-order garments tailored to your specifications.
              Due to the personalized nature of these items:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Customized orders cannot be cancelled once production has begun</li>
              <li>Delivery timelines for custom orders may vary (typically 7–21 business days)</li>
              <li>Minor variations in color or fabric texture from digital previews are possible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Intellectual Property</h2>
            <p>
              All content on this website — including text, images, logos, product designs, and graphics — is the
              property of NAVADHA Fashion Co and is protected by applicable intellectual property laws. You may
              not reproduce, distribute, or use any content without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
            <p>
              NAVADHA Fashion Co shall not be liable for any indirect, incidental, or consequential damages
              arising from your use of our website or products. Our total liability to you for any claim shall
              not exceed the amount paid by you for the relevant order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Governing Law</h2>
            <p>
              These Terms of Use are governed by the laws of India. Any disputes arising from these terms or
              your use of our website shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Contact Us</h2>
            <p>For any questions regarding these Terms of Use, please contact us:</p>
            <div className="mt-3 space-y-1">
              <p>NAVADHA Fashion Co</p>
              <p>Email: <a href="mailto:navadhafashionco@gmail.com" className="text-pink-500 hover:text-pink-600 transition-colors">navadhafashionco@gmail.com</a></p>
              <p>Website: <a href="/contact" className="text-pink-500 hover:text-pink-600 transition-colors">Contact Us</a></p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
