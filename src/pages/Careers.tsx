import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Rocket, FileText, Video, CheckCircle, ArrowLeft } from 'lucide-react';export default function Careers() {

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
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-lg mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Why Join Navadha?</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Build From Ground Up</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Join us in the early stages and help shape the future of our brand. Your contributions will make a real impact.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Learn & Grow</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gain hands-on experience in the fashion industry with mentorship and opportunities to develop your skills.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Flexible Work</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Choose between store-based or remote positions. We offer flexibility to match your lifestyle and preferences.
              </p>
            </div>
          </div>
        </div>

        {/* How to Apply Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4 text-white">How to Apply</h2>
          <p className="text-center text-sm sm:text-base text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Our simple and transparent hiring process ensures you know what to expect at every step
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg mb-3 sm:mb-4">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl font-bold text-white">01</span>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Submit Application</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300">
                  Fill out the application form by clicking "Apply for this position" on any job listing. Share your details and tell us why you're interested.
                </p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-white/50" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg mb-3 sm:mb-4">
                  <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl font-bold text-white">02</span>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Interview Round</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300">
                  If your profile matches our requirements, we'll schedule an interview. This can be in-person or virtual depending on the role.
                </p>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-white/50" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/20 h-full">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg mb-3 sm:mb-4">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl font-bold text-white">03</span>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Final Selection</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300">
                  Based on your interview performance, we'll shortlist candidates and extend offers to the selected individuals. Welcome to the team!
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-gray-300 text-xs sm:text-sm">
              We typically respond to applications within 5-7 business days. Selected candidates will be contacted via email.
            </p>
          </div>
        </div>



        {/* Final CTA */}
        <div className="text-center px-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We're excited to meet talented individuals who share our passion for fashion. Click on any position above to view details and apply.
          </p>
        </div>
      </div>
    </div>
  );
}
