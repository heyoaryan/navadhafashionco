import { Truck, Package } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Fast & Reliable Delivery Across India
          </p>
        </div>

        {/* Shipping Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6">
            <Truck className="w-10 h-10 text-pink-500 mb-3" />
            <h3 className="text-xl font-bold mb-2">Standard Shipping</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">FREE</span> on orders above ₹2,999
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ₹99 for orders below ₹2,999 • 5-7 business days
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6">
            <Package className="w-10 h-10 text-pink-500 mb-3" />
            <h3 className="text-xl font-bold mb-2">Express Shipping</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">₹199</span> additional charge
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Available for all orders • 2-3 business days
            </p>
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Orders processed within 1-2 business days</li>
            <li>• Tracking number sent via email & SMS</li>
            <li>• Store pickup available in Umargam, Gujarat</li>
            <li>• Delivery times may vary during peak seasons</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
