import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import SEO from '../components/SEO';

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Us | NAVADHA Fashion Co"
        description="Get in touch with NAVADHA Fashion Co. We're here to help with orders, styling advice, returns, and any questions you may have. Reach us via email, phone, or our contact form."
        keywords="contact NAVADHA, fashion store contact, customer support India, NAVADHA help, fashion brand contact"
        url="https://navadha.com/contact"
      />
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Get in Touch</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">navadhafashionco@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">+91 6351129401</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Store Address</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Navadha Fashion Co.<br />
                    Shop No. 110, Apex Lake View,<br />
                    Opp. Akramaruti Lake, Umbergaon - 396171<br />
                    Umargam, Gujarat 396170<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Business Hours</h3>
                  <p className="text-gray-600 dark:text-gray-400">Monday - Sunday: 10:00 AM - 9:00 PM</p>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="rounded-xl overflow-hidden h-64 shadow-md">
              <iframe
                title="Navadha Fashion Co. Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3745.012376446052!2d72.78397687506921!3d20.175210181269094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be72b8c6f20f54b%3A0x3f4a36ab30d4ce2c!2sNavadha%20Fashion%20Co!5e0!3m2!1sen!2sin!4v1773769339425!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Order Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Questions about your order?
            </p>
            <a href="mailto:navadhafashionco@gmail.com" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">
              navadhafashionco@gmail.com
            </a>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Returns & Exchanges</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Need to return an item?
            </p>
            <a href="mailto:navadhafashionco@gmail.com" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">
              navadhafashionco@gmail.com
            </a>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Careers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Want to join our team?
            </p>
            <a href="mailto:navadhafashionco@gmail.com" className="text-pink-600 dark:text-pink-400 font-semibold hover:underline">
              navadhafashionco@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
