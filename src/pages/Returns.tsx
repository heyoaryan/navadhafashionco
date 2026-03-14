import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

export default function Returns() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <RotateCcw className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Returns & Exchanges</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            5-Day Hassle-Free Returns
          </p>
        </div>

        {/* Return Process */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              1
            </div>
            <h3 className="font-semibold mb-1 text-sm">Login to Account</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Select order to return
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              2
            </div>
            <h3 className="font-semibold mb-1 text-sm">Request Return</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Choose return reason
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-5 text-center">
            <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              3
            </div>
            <h3 className="font-semibold mb-1 text-sm">Ship It Back</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Use provided label
            </p>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Eligible for Return</h3>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Within 5 days of delivery</li>
                <li>• Unworn & unwashed</li>
                <li>• Original tags intact</li>
                <li>• No damage or alterations</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold">Not Eligible</h3>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• After 5 days</li>
                <li>• Worn or washed items</li>
                <li>• Missing tags</li>
                <li>• Custom/Sale items</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Info */}
        <div className="bg-pink-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Refund Information</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Refunds processed in 7-10 business days</li>
            <li>• Credited to original payment method</li>
            <li>• Bank processing: 3-5 additional days</li>
            <li>• Exchanges subject to availability</li>
          </ul>
          <p className="mt-4 text-sm font-semibold">
            Need help? Email: returns@navadha.com
          </p>
        </div>
      </div>
    </div>
  );
}
