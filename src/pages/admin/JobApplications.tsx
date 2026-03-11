import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Eye, Trash2, Filter, ArrowLeft } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface JobApplication {
  id: string;
  job_title: string;
  location_type: string;
  full_name: string;
  email: string;
  phone: string;
  experience: string;
  cover_letter: string;
  resume_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function JobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  // Lock scroll when detail modal is open
  useEffect(() => {
    if (selectedApp) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [selectedApp]);

  const fetchApplications = async () => {
    try {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const downloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(resumeUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicantName}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'reviewing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'shortlisted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'hired': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-full h-12 w-12 border-4 border-pink-200 animate-spin" style={{ borderTopColor: '#EE458F' }}></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 lg:px-0">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Back Button */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Job Applications</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Position
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Experience
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-gray-100 truncate">{app.full_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">{app.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{app.phone}</div>
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{app.job_title}</div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm lg:text-base text-gray-900 dark:text-gray-100 truncate">{app.job_title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{app.location_type}</div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                    {app.experience}
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={`w-full sm:w-auto px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      {app.resume_url && (
                        <button
                          onClick={() => downloadResume(app.resume_url!, app.full_name)}
                          className="p-1 sm:p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Resume"
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {applications.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">No applications found</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedApp(null)}></div>
          <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">Application Details</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Position</label>
                  <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100">{selectedApp.job_title}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{selectedApp.full_name}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 break-all">{selectedApp.email}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{selectedApp.phone}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Experience</label>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100">{selectedApp.experience}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Cover Letter</label>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded text-gray-900 dark:text-gray-100">{selectedApp.cover_letter}</p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedApp(null)}
                className="mt-4 sm:mt-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:opacity-90 transition-opacity text-white"
                style={{ backgroundColor: '#EE458F' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
