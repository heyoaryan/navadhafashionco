import { Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      
      {/* Founder Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Image Side */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl blur-2xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                alt="Navadha Fashion"
                className="relative rounded-2xl shadow-2xl w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6 text-center">
            <div className="inline-block relative">
              <div className="absolute inset-0 blur-3xl" style={{ backgroundColor: '#EE458F33' }}></div>
              <h1 className="brand-title text-4xl sm:text-5xl lg:text-7xl mb-3 sm:mb-4 relative drop-shadow-2xl" style={{ color: '#EE458F' }}>
                NAVADHA
              </h1>
              <div className="flex items-center justify-center gap-2 sm:gap-3 relative">
                <div className="h-[1px] w-8 sm:w-12 lg:w-20" style={{ background: 'linear-gradient(to right, transparent, #EE458F80, #EE458F)' }}></div>
                <span className="text-xs sm:text-sm font-light tracking-[0.3em] whitespace-nowrap" style={{ color: '#EE458F' }}>
                  FASHION CO
                </span>
                <div className="h-[1px] w-8 sm:w-12 lg:w-20" style={{ background: 'linear-gradient(to left, transparent, #EE458F80, #EE458F)' }}></div>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Founder - <span className="text-pink-600 dark:text-pink-400">Aanchal Mishra</span>
            </h2>
            
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              In 2026, what started as a dream inspired by my mother's passion for fashion became Navadha Fashion Co. Growing up, I watched her create beautiful garments with love and dedication.
            </p>
            
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              The name <span className="font-bold text-pink-600 dark:text-pink-400">"Navadha"</span> originates from the Ramayana, meaning <span className="italic">"nine forms of devotion"</span> or <span className="italic">"new path"</span> — reflecting our commitment to craftsmanship and innovation.
            </p>

            <div className="pt-4">
              <div className="flex items-start gap-3 bg-pink-50 dark:bg-gray-800 p-4 sm:p-6 rounded-xl">
                <Sparkles className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Creative Director's Vision</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Every piece carries forward a legacy of love, excellence, and the timeless bond between tradition and modernity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
