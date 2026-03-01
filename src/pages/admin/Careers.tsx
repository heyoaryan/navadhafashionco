import { Link } from 'react-router-dom';
import { Briefcase, FileText, PlusCircle } from 'lucide-react';

export default function Careers() {
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">Careers Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Job Applications Card */}
        <Link
          to="/admin/careers/applications"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow group border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 sm:p-4 rounded-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: '#FEE2F8' }}>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#EE458F' }} />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            <span className="group-hover:text-[#EE458F] transition-colors">Job Applications</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            View and manage all job applications submitted by candidates
          </p>
          <div className="flex items-center text-sm sm:text-base font-semibold" style={{ color: '#EE458F' }}>
            View Applications
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Job Positions Card */}
        <Link
          to="/admin/careers/positions"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow group border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 sm:p-4 rounded-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: '#FEE2F8' }}>
              <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#EE458F' }} />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            <span className="group-hover:text-[#EE458F] transition-colors">Job Positions</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            Create, edit, and manage job openings for your company
          </p>
          <div className="flex items-center text-sm sm:text-base font-semibold" style={{ color: '#EE458F' }}>
            Manage Positions
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#EE458F' }}>-</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#FEE2F8' }}>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#EE458F' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Active Positions</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#EE458F' }}>-</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#FEE2F8' }}>
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#EE458F' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#EE458F' }}>-</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#FEE2F8' }}>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#EE458F' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
