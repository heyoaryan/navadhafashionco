import { Link } from 'react-router-dom';
import { Briefcase, FileText, Users, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Careers() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    activePositions: 0,
    pendingReview: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: totalApps },
          { count: activePos },
          { count: pendingCount },
          { count: shortlistedCount },
          { count: rejectedCount },
          { count: hiredCount },
          { data: recent },
        ] = await Promise.all([
          supabase.from('job_applications').select('*', { count: 'exact', head: true }),
          supabase.from('job_positions').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
          supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
          supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'hired'),
          supabase.from('job_applications').select('full_name, position_applied, status, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          totalApplications: totalApps || 0,
          activePositions: activePos || 0,
          pendingReview: pendingCount || 0,
          shortlisted: shortlistedCount || 0,
          rejected: rejectedCount || 0,
          hired: hiredCount || 0,
        });
        setRecentApplications(recent || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'shortlisted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'hired': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 text-gray-900 dark:text-gray-100">Careers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage job openings and applicants</p>
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        {/* Nav + pipeline skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
            <div className="sm:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse space-y-3">
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-1 text-gray-900 dark:text-gray-100">Careers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage job openings and applicants</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-gray-100">{stats.totalApplications}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applications</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <Briefcase className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-gray-100">{stats.activePositions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Open Positions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-400">Pending</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-gray-100">{stats.pendingReview}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending Review</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-400">Hired</span>
          </div>
          <p className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-gray-100">{stats.hired}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hired</p>
        </div>
      </div>

      {/* Navigation cards + pipeline side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Nav cards stacked */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/careers/applications"
            className="group bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20 rounded-xl p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 text-rose-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform mt-1" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Job Applications</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">View and manage all submitted applications</p>
            <span className="text-xs font-medium text-rose-500">
              {stats.pendingReview > 0 ? `${stats.pendingReview} pending review` : 'All reviewed'}
            </span>
          </Link>

          <Link
            to="/admin/careers/positions"
            className="group bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20 rounded-xl p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 text-purple-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform mt-1" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Job Positions</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Create and manage open job roles</p>
            <span className="text-xs font-medium text-purple-500">
              {stats.activePositions} active {stats.activePositions === 1 ? 'position' : 'positions'}
            </span>
          </Link>

          {/* Application pipeline bar */}
          <div className="sm:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Application Pipeline
            </h3>
            {stats.totalApplications === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Pending', count: stats.pendingReview, color: 'bg-yellow-400' },
                  { label: 'Shortlisted', count: stats.shortlisted, color: 'bg-blue-400' },
                  { label: 'Hired', count: stats.hired, color: 'bg-green-400' },
                  { label: 'Rejected', count: stats.rejected, color: 'bg-red-400' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${stats.totalApplications > 0 ? (item.count / stats.totalApplications) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Applications</h3>
            <Link to="/admin/careers/applications" className="text-xs text-rose-500 hover:text-rose-600">View all</Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {app.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.position_applied}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
