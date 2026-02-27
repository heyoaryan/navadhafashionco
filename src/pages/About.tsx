import { useLocation } from 'react-router-dom';

export default function About() {
  const location = useLocation();
  const path = location.pathname.slice(1);

  const content: Record<string, { title: string; subtitle: string; body: string[] }> = {
    about: {
      title: 'About Navadha',
      subtitle: 'Redefining Fashion for the Modern Generation',
      body: [
        'Founded in 2026, Navadha Fashion Co. emerged from a simple vision: to create clothing that embodies both timeless elegance and contemporary style. We believe fashion should be an expression of individuality while maintaining the highest standards of quality and sustainability.',
        'Our collections are thoughtfully curated to reflect the diverse tastes of our global community. From elegant ready-made pieces to personalized custom designs, each item in our catalog is designed to empower you to express your unique style with confidence.',
        'We partner with ethical manufacturers and use premium, sustainable materials to create pieces that not only look good but also contribute to a better future for our planet. Every stitch, every fabric choice, and every design decision is made with both you and the environment in mind.',
      ],
    },
    sustainability: {
      title: 'Our Commitment to Sustainability',
      subtitle: 'Fashion with a Conscience',
      body: [
        'At Navadha, we believe that great fashion should never come at the cost of our planet. Our sustainability commitment is woven into every aspect of our business, from sourcing to shipping.',
        'We use organic and recycled materials whenever possible, partner with factories that meet strict environmental and labor standards, and implement eco-friendly packaging solutions. Our goal is to minimize our carbon footprint while maximizing quality and style.',
        'We are constantly innovating to find new ways to reduce waste, conserve resources, and create a more circular fashion economy. Join us in our journey towards a more sustainable future, one beautiful piece at a time.',
      ],
    },
    contact: {
      title: 'Get in Touch',
      subtitle: 'We Would Love to Hear from You',
      body: [
        'Have a question, suggestion, or just want to say hello? Our team is here to help.',
        'Email: hello@navadha.com',
        'Phone: +91 1800 123 4567',
        'Address: 123 Fashion Street, Mumbai, Maharashtra 400001, India',
        'Business Hours: Monday - Saturday, 10:00 AM - 7:00 PM IST',
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything You Need to Know',
      body: [
        'Q: What is your return policy? A: We offer hassle-free returns within 30 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached.',
        'Q: How long does shipping take? A: Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days delivery.',
        'Q: Do you ship internationally? A: Yes, we ship to most countries worldwide. International shipping times vary by location.',
        'Q: How do I track my order? A: Once your order ships, you will receive a tracking number via email.',
        'Q: What payment methods do you accept? A: We accept all major credit cards, debit cards, UPI, and net banking.',
      ],
    },
    shipping: {
      title: 'Shipping Information',
      subtitle: 'Fast and Reliable Delivery',
      body: [
        'We offer free standard shipping on all orders above ₹2,999. Orders below this amount have a flat shipping fee of ₹99.',
        'Standard Shipping: 5-7 business days',
        'Express Shipping: 2-3 business days (additional charges apply)',
        'International Shipping: 10-15 business days',
        'All orders are processed within 1-2 business days. You will receive a tracking number once your order ships.',
      ],
    },
    returns: {
      title: 'Returns & Exchanges',
      subtitle: '30-Day Hassle-Free Returns',
      body: [
        'We want you to love your purchase. If for any reason you are not satisfied, we accept returns within 30 days of delivery.',
        'Items must be unworn, unwashed, and in original condition with all tags attached.',
        'To initiate a return, log in to your account and select the order you wish to return. Follow the instructions to generate a return label.',
        'Refunds are processed within 7-10 business days of receiving your return. The amount will be credited to your original payment method.',
        'Exchanges are subject to availability. If the item you want to exchange for is out of stock, we will process a full refund instead.',
      ],
    },
    'size-guide': {
      title: 'Size Guide',
      subtitle: 'Find Your Perfect Fit',
      body: [
        'Our clothing is designed to fit true to size. Please refer to the size chart below for measurements.',
        'Tops and Shirts: XS (Chest: 32-34"), S (36"), M (38"), L (40"), XL (42"), XXL (44")',
        'Bottoms: XS (Waist: 26-28"), S (30"), M (32"), L (34"), XL (36"), XXL (38")',
        'If you are between sizes, we recommend sizing up for a more relaxed fit.',
        'For detailed measurements and fit guides for specific items, please check the product page.',
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Your Privacy Matters to Us',
      body: [
        'At Navadha, we are committed to protecting your privacy and ensuring the security of your personal information.',
        'We collect information necessary to process your orders, improve your shopping experience, and communicate with you about products and promotions.',
        'We do not sell, trade, or rent your personal information to third parties. Your data is stored securely and accessed only by authorized personnel.',
        'By using our website, you consent to our privacy policy and agree to its terms.',
        'For questions about our privacy practices, please contact us at privacy@navadha.com.',
      ],
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'Important Information',
      body: [
        'By accessing and using this website, you accept and agree to be bound by the terms and conditions outlined here.',
        'All content on this website, including text, graphics, logos, and images, is the property of Navadha Fashion Co. and protected by copyright laws.',
        'You may not reproduce, distribute, or transmit any content from this site without our express written permission.',
        'We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion.',
        'Prices and availability are subject to change without notice.',
      ],
    },
  };

  const page = content[path] || content.about;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wider mb-3 sm:mb-4">{page.title}</h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">{page.subtitle}</p>
      </div>

      <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none">
        {page.body.map((paragraph, index) => (
          <p key={index} className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
