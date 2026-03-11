import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface JobPosition {
  id: string;
  title: string;
  type: 'internship' | 'fulltime';
  location_type: 'store' | 'remote';
  department: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  is_active: boolean;
  created_at: string;
}

export default function JobPositions() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'internship' as 'internship' | 'fulltime',
    location_type: 'store' as 'store' | 'remote',
    department: '',
    experience: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    is_active: true,
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  // Lock scroll when form modal is open
  useEffect(() => {
    if (showForm) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showForm]);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('job_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty strings
    const cleanedData = {
      ...formData,
      responsibilities: formData.responsibilities.filter(r => r.trim()),
      requirements: formData.requirements.filter(r => r.trim()),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('job_positions')
          .update(cleanedData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_positions')
          .insert([cleanedData]);

        if (error) throw error;
      }

      fetchPositions();
      resetForm();
    } catch (error) {
      console.error('Error saving position:', error);
    }
  };

  const editPosition = (position: JobPosition) => {
    setFormData({
      title: position.title,
      type: position.type,
      location_type: position.location_type,
      department: position.department,
      experience: position.experience,
      description: position.description,
      responsibilities: position.responsibilities,
      requirements: position.requirements,
      is_active: position.is_active,
    });
    setEditingId(position.id);
    setShowForm(true);
  };

  const deletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;

    try {
      const { error } = await supabase
        .from('job_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('job_positions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPositions();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'internship',
      location_type: 'store',
      department: '',
      experience: '',
      description: '',
      responsibilities: [''],
      requirements: [''],
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const addArrayField = (field: 'responsibilities' | 'requirements') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const updateArrayField = (field: 'responsibilities' | 'requirements', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  const removeArrayField = (field: 'responsibilities' | 'requirements', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-full h-12 w-12 border-4 border-pink-200 animate-spin" style={{ borderTopColor: '#EE458F' }}></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Job Positions</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#EE458F' }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Position
          </button>
        </div>
      </div>

      {/* Positions List */}
      <div className="grid gap-3 sm:gap-4">
        {positions.map((position) => (
          <div
            key={position.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{position.title}</h3>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                    position.type === 'internship'
                      ? 'text-white'
                      : 'text-white'
                  }`} style={{ backgroundColor: '#EE458F' }}>
                    {position.type === 'internship' ? 'Internship' : 'Full Time'}
                  </span>
                  <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 capitalize">
                    {position.location_type}
                  </span>
                  {!position.is_active && (
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">{position.department} • {position.experience}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{position.description}</p>
              </div>
              <div className="flex sm:flex-col items-center gap-2 sm:ml-4">
                <button
                  onClick={() => toggleActive(position.id, position.is_active)}
                  className={`p-1.5 sm:p-2 rounded ${
                    position.is_active
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={position.is_active ? 'Active' : 'Inactive'}
                >
                  {position.is_active ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <button
                  onClick={() => editPosition(position)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => deletePosition(position.id)}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={resetForm}></div>
          <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                {editingId ? 'Edit Position' : 'Add New Position'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Department *</label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="internship">Internship</option>
                      <option value="fulltime">Full Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Location *</label>
                    <select
                      value={formData.location_type}
                      onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="store">Store</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Experience *</label>
                    <input
                      type="text"
                      required
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g., 2-4 years or Fresher"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Responsibilities *</label>
                  {formData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => updateArrayField('responsibilities', index, e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter responsibility"
                      />
                      {formData.responsibilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('responsibilities', index)}
                          className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded whitespace-nowrap"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('responsibilities')}
                    className="text-xs sm:text-sm hover:opacity-80 transition-opacity"
                    style={{ color: '#EE458F' }}
                  >
                    + Add Responsibility
                  </button>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Requirements *</label>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter requirement"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('requirements', index)}
                          className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded whitespace-nowrap"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('requirements')}
                    className="text-xs sm:text-sm hover:opacity-80 transition-opacity"
                    style={{ color: '#EE458F' }}
                  >
                    + Add Requirement
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#EE458F' }}
                  >
                    {editingId ? 'Update' : 'Create'} Position
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
