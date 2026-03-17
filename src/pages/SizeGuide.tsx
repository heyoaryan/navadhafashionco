import { Ruler } from 'lucide-react';

export default function SizeGuide() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Ruler className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider">Size Guide</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive size guide. All measurements are in inches.
          </p>
        </div>

        {/* Women's Clothing Size Chart */}
        <div className="mb-12">
          <h2 className="text-2xl font-light tracking-wider mb-6">Women's Clothing</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-rose-50 dark:bg-rose-900/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Bust (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Waist (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Hips (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Length (inches)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">XS</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">30-32</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">24-26</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">34-36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">38-40</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">S</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">32-34</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">26-28</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">36-38</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">40-42</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">M</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">34-36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">28-30</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">38-40</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">42-44</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">L</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">36-38</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">30-32</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">40-42</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">44-46</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">XL</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">38-40</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">32-34</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">42-44</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">46-48</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">XXL</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">40-42</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">34-36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">44-46</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">48-50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Saree Blouse Size Chart */}
        <div className="mb-12">
          <h2 className="text-2xl font-light tracking-wider mb-6">Saree Blouse</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-rose-50 dark:bg-rose-900/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Bust (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Waist (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Shoulder (inches)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                      Blouse Length (inches)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">32</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">32</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">26</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">14</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">14-15</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">34</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">34</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">28</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">14.5</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">15-16</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">30</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">15</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">15-16</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">38</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">38</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">32</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">15.5</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">16-17</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">40</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">40</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">34</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">16</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">16-17</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">42</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">42</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">36</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">16.5</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">17-18</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* How to Measure */}
        <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg p-8">
          <h2 className="text-2xl font-light tracking-wider mb-6">How to Measure</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-rose-600 dark:text-rose-400">Bust</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Measure around the fullest part of your bust, keeping the tape parallel to the floor.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-rose-600 dark:text-rose-400">Waist</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Measure around your natural waistline, keeping the tape comfortably loose.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-rose-600 dark:text-rose-400">Hips</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Measure around the fullest part of your hips, approximately 8 inches below your waist.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-rose-600 dark:text-rose-400">Length</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Measure from the highest point of your shoulder down to where you want the garment to end.
              </p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">Note:</strong> If you're between sizes, we recommend sizing up for a more comfortable fit. For custom measurements or special requests, please contact our customer service team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
