import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Clock, ArrowLeft, ChevronDown } from 'lucide-react';
import JobApplicationModal from '../../components/JobApplicationModal';
import { supabase } from '../../lib/supabase';

interface JobPosition {
  id: string;
  title: string;
  type: 'internship' | 'fulltime';
  department: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}

export default function StoreCareers() {
  const [selectedType, setSelectedType] = useState<'all' | 'internship' | 'fulltime'>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applicationModal, setApplicationModal] = useState<{ isOpen: boolean; jobTitle: string }>({
    isOpen: false,
    jobTitle: '',
  });
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from database
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .eq('location_type', 'store')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobPositions(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = selectedType === 'all' 
    ? jobPositions 
    : jobPositions.filter(job => job.type === selectedType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] bg-gray-900 overflow-hidden">
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80)',
          }}
        ></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70"></div>

        {/* Navigation Button */}
        <Link
          to="/careers"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Careers</span>
        </Link>

        {/* Hero Content - Centered */}
        <div className="relative h-full flex items-center justify-center z-10 pt-16 sm:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight px-4">
                Store Positions
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-2 px-4">
                Umargam, Gujarat
              </p>
              
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
                Join our physical store team and be part of the in-person customer experience
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Positions ({jobPositions.length})
          </button>
          <button
            onClick={() => setSelectedType('internship')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'internship'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Internships ({jobPositions.filter(j => j.type === 'internship').length})
          </button>
          <button
            onClick={() => setSelectedType('fulltime')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'fulltime'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Full Time ({jobPositions.filter(j => j.type === 'fulltime').length})
          </button>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.type === 'internship'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {job.type === 'internship' ? 'Internship' : 'Full Time'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.experience}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Umargam, Gujarat
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      expandedJob === job.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedJob === job.id && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{job.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-3">Responsibilities</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {job.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-900 dark:text-white mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Requirements</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-gray-900 dark:text-white mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setApplicationModal({ isOpen: true, jobTitle: job.title })}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                  >
                    Apply for this position
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No positions available in this category.</p>
          </div>
        )}
      </div>

      {/* Application Modal */}
      <JobApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, jobTitle: '' })}
        jobTitle={applicationModal.jobTitle}
        jobType="store"
      />
    </div>
  );
}
