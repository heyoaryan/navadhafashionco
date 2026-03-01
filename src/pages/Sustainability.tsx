import { Leaf, Recycle, Heart, Users } from 'lucide-react';

export default function Sustainability() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Leaf className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Sustainability</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Fashion with a Conscience
          </p>
        </div>

        {/* Mission */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 mb-10 text-center">
          <p className="text-lg leading-relaxed">
            At Navadha, sustainability is woven into every aspect of our business. From sourcing to shipping, we make conscious choices that benefit both people and the planet.
          </p>
        </div>

        {/* Initiatives */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6">
            <Leaf className="w-10 h-10 text-green-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">Sustainable Materials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organic cotton, recycled fabrics, and eco-friendly materials from certified suppliers.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6">
            <Recycle className="w-10 h-10 text-green-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">Circular Fashion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Designed for longevity with take-back program for recycling and upcycling.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6">
            <Users className="w-10 h-10 text-green-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">Ethical Manufacturing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fair wages, safe working conditions, and respect for workers' rights.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6">
            <Heart className="w-10 h-10 text-green-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">Community Impact</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Supporting local artisans and environmental conservation projects.
            </p>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Our 2026 Goals</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• 100% sustainable materials across all collections</li>
            <li>• Carbon neutral shipping</li>
            <li>• Zero waste production</li>
            <li>• Annual sustainability transparency reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
