import { Link } from 'react-router-dom';
import { MapPin, Wifi, Briefcase, ArrowRight, Users, Target, Rocket, Home, FileText, Video, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Careers() {
  const [storePositionsCount, setStorePositionsCount] = useState(0);
  const [remotePositionsCount, setRemotePositionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositionCounts = async () => {
      try {
        // Fetch store positions count
        const { count: storeCount } = await supabase
          .from('job_positions')
          .select('*', { count: 'exact', head: true })
          .eq('location_type', 'store')
          .eq('status', 'active');

        // Fetch remote positions count
        const { count: remoteCount } = await supabase
          .from('job_positions')
          .select('*', { count: 'exact', head: true })
          .eq('location_type', 'remote')
          .eq('status', 'active');

        setStorePositionsCount(storeCount || 0);
        setRemotePositionsCount(remoteCount || 0);
      } catch (error) {
        console.error('Error fetching position counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositionCounts();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section with Background Image */}
      <div className="relative h-[70vh] min-h-[500px] bg-gray-900 overflow-hidden">
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80)',
          }}
        ></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70"></div>

        {/* Home Button */}
        <Link
          to="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 text-sm sm:text-base"
        >
          <Home className="w-4 h-4" />
          <span className="font-medium hidden sm:inline">Back to Home</span>
          <span className="font-medium sm:hidden">Home</span>
        </Link>

        {/* Hero Content - Centered */}
        <div className="relative h-full flex items-center justify-center z-10 pt-16 sm:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                <Rocket className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-xs sm:text-sm">We're Building Our Team</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight px-4">
                Join Our
                <br />
                Fashion Journey
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed px-4 max-w-3xl mx-auto">
                Be part of Navadha Fashion Co. and help us redefine contemporary fashion in India
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center px-4">
                <Link
                  to="/careers/store"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base"
                >
                  Explore Store Positions
                </Link>
                <Link
                  to="/careers/remote"
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-all border-2 border-white/30 text-sm sm:text-base"
                >
                  Explore Remote Positions
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Why Join Us */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 shadow-lg mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join Navadha?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Build From Ground Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join us in the early stages and help shape the future of our brand. Your contributions will make a real impact.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Learn & Grow</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gain hands-on experience in the fashion industry with mentorship and opportunities to develop your skills.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexible Work</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose between store-based or remote positions. We offer flexibility to match your lifestyle and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* How to Apply Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 sm:p-12 shadow-xl mb-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">How to Apply</h2>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            Our simple and transparent hiring process ensures you know what to expect at every step
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4">
                  <FileText className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-white">01</span>
                  <h3 className="text-xl font-semibold text-white">Submit Application</h3>
                </div>
                <p className="text-gray-300">
                  Fill out the application form by clicking "Apply for this position" on any job listing. Share your details and tell us why you're interested.
                </p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-white/50" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4">
                  <Video className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-white">02</span>
                  <h3 className="text-xl font-semibold text-white">Interview Round</h3>
                </div>
                <p className="text-gray-300">
                  If your profile matches our requirements, we'll schedule an interview. This can be in-person or virtual depending on the role.
                </p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-white/50" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4">
                  <CheckCircle className="w-6 h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-white">03</span>
                  <h3 className="text-xl font-semibold text-white">Final Selection</h3>
                </div>
                <p className="text-gray-300">
                  Based on your interview performance, we'll shortlist candidates and extend offers to the selected individuals. Welcome to the team!
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              We typically respond to applications within 5-7 business days. Selected candidates will be contacted via email.
            </p>
          </div>
        </div>

        {/* Ready to Join - Work Locations */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the work environment that suits you best and explore available opportunities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Store Positions */}
          <Link
            to="/careers/store"
            className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700"
          >
            {/* Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
                alt="Store"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-3">Store Positions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Work at our physical store location in Umargam, Gujarat. Be part of the in-person customer experience.
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {loading ? 'Loading...' : `${storePositionsCount} Open Position${storePositionsCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Umargam, Gujarat</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold group-hover:gap-4 transition-all">
                <span>View Positions</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Remote Positions */}
          <Link
            to="/careers/remote"
            className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700"
          >
            {/* Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="Remote Work"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-2">
                  <Wifi className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-3">Remote Positions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Work from anywhere in India. Flexible remote opportunities for digital roles and creative positions.
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {loading ? 'Loading...' : `${remotePositionsCount} Open Position${remotePositionsCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Wifi className="w-4 h-4" />
                  <span>Work From Home</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold group-hover:gap-4 transition-all">
                <span>View Positions</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We're excited to meet talented individuals who share our passion for fashion. Click on any position above to view details and apply.
          </p>
        </div>
      </div>
    </div>
  );
}
