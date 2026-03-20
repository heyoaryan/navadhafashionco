import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Orders & Payment',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery (for eligible orders). All payments are processed securely through our payment gateway.',
        },
        {
          q: 'How do I track my order?',
          a: 'Once your order ships, you will receive a tracking number via email and SMS. You can also track your order by logging into your account and viewing your order history.',
        },
        {
          q: 'Can I modify or cancel my order?',
          a: 'You can modify or cancel your order within 2 hours of placement. After that, the order enters processing and cannot be changed. Please contact us immediately if you need to make changes.',
        },
        {
          q: 'Do you offer Cash on Delivery?',
          a: 'Yes, Cash on Delivery is available for orders with Home Delivery option. For Store Pickup, you can choose "Pay at Store" option.',
        },
      ],
    },
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for an additional ₹199. Delivery times vary by location - Gujarat: 3-4 days, Metro cities: 4-5 days.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Currently, we only ship within India. We are working on expanding our international shipping soon.',
        },
        {
          q: 'What if I am not available to receive my order?',
          a: 'Our delivery partner will attempt delivery 2-3 times. If unsuccessful, the package will be held at the local facility for 7 days. You can also reschedule delivery through the tracking link.',
        },
        {
          q: 'Is there a minimum order value for free shipping?',
          a: 'Yes, we offer free standard shipping on all orders above ₹2,999. Orders below this amount have a flat shipping fee of ₹99.',
        },
      ],
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer hassle-free returns within 5 days of delivery. Items must be unworn, unwashed, and in original condition with all tags attached.',
        },
        {
          q: 'How do I return an item?',
          a: 'Login to your account, go to Orders, select the item you want to return, and click "Return Item". Follow the instructions to generate a return label and ship it back to us.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 7-10 business days of receiving your return. The amount will be credited to your original payment method. Bank processing may take an additional 3-5 days.',
        },
        {
          q: 'Can I exchange an item for a different size or color?',
          a: 'Yes, exchanges are available subject to stock availability. Initiate a return and select "Exchange" as the reason. If the item is out of stock, we will process a full refund.',
        },
      ],
    },
    {
      category: 'Products & Sizing',
      questions: [
        {
          q: 'How do I find my size?',
          a: 'Each product page has a detailed size guide. Click on "Size Guide" to view measurements. Our clothing is designed to fit true to size. If you are between sizes, we recommend sizing up.',
        },
        {
          q: 'Are your products true to color?',
          a: 'We strive to display accurate colors, but slight variations may occur due to screen settings and lighting. Product descriptions include detailed color information.',
        },
        {
          q: 'Do you offer custom or personalized items?',
          a: 'Yes! Visit our Boutique section for custom and personalized fashion options. You can customize designs, fabrics, and measurements.',
        },
        {
          q: 'How do I care for my garments?',
          a: 'Care instructions are provided on the product tag and description. Generally, we recommend gentle machine wash or hand wash in cold water and air drying to maintain quality.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'Do I need an account to place an order?',
          a: 'Yes, you need to create an account to place orders. This helps us provide better service, track your orders, and offer personalized recommendations.',
        },
        {
          q: 'Is my personal information secure?',
          a: 'Absolutely! We use industry-standard encryption and security measures to protect your personal and payment information. We never share your data with third parties.',
        },
        {
          q: 'How do I reset my password?',
          a: 'Click on "Forgot Password" on the login page. Enter your email address, and we will send you a password reset link.',
        },
        {
          q: 'Can I save multiple addresses?',
          a: 'Yes, you can save multiple shipping addresses in your account for faster checkout. Go to Account > Addresses to manage your saved addresses.',
        },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="FAQ - Frequently Asked Questions | NAVADHA Fashion Co"
        description="Find answers to common questions about shopping at NAVADHA — orders, payments, shipping, returns, sizing, and more. We're here to help."
        keywords="NAVADHA FAQ, fashion store questions, shipping policy India, return policy, size guide, payment methods, order tracking"
        url="https://navadha.com/faq"
      />
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <HelpCircle className="w-12 h-12 sm:w-16 sm:h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
            Find answers to common questions about shopping with Navadha
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold mb-4 text-pink-600 dark:text-pink-400">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openIndex === globalIndex;

                  return (
                    <div
                      key={faqIndex}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white pr-4">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 sm:mt-12 text-center bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Still Have Questions?</h3>
          <p className="text-sm sm:text-base mb-4">
            Our customer support team is here to help you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:navadhafashionco@gmail.com"
              className="px-6 py-3 bg-white text-pink-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Email Us
            </a>
            <a
              href="tel:+911800123456"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
