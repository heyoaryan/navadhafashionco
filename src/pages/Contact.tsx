import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { validateEmail, validatePhone } from '../utils/validation';
import SEO from '../components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setErrors({ ...errors, email: 'Please use a valid email from: Gmail, Yahoo, Hotmail, Outlook, Rediffmail, etc.' });
      return;
    }
    
    // Validate phone if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      setErrors({ ...errors, phone: 'Please enter a valid 10-digit phone number' });
      return;
    }
    
    setErrors({});
    // Handle form submission
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

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

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
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
                  <p className="text-gray-600 dark:text-gray-400">Monday - Saturday: 10:00 AM - 7:00 PM</p>
                  <p className="text-gray-600 dark:text-gray-400">Sunday: Closed</p>
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

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800`}
                  placeholder="name@gmail.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                    setErrors({ ...errors, phone: undefined });
                  }}
                  className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800`}
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
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
