import { useState, useEffect } from 'react';
import { X, Upload, Mail, Phone, User, FileText, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useScrollLock } from '../hooks/useScrollLock';
import { validateEmail, validatePhone } from '../utils/validation';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobType: 'store' | 'remote';
  jobPositionId?: string;
}

export default function JobApplicationModal({ isOpen, onClose, jobTitle, jobType, jobPositionId }: JobApplicationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; phone?: string }>({});

  // Lock body scroll when modal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    // Validate email
    if (!validateEmail(formData.email)) {
      setValidationErrors({ email: 'Please use a valid email from: Gmail, Yahoo, Hotmail, Outlook, etc.' });
      setIsSubmitting(false);
      return;
    }

    // Validate phone
    if (!validatePhone(formData.phone)) {
      setValidationErrors({ phone: 'Please enter a valid 10-digit phone number' });
      setIsSubmitting(false);
      return;
    }

    try {
      let resumeUrl = null;

      // Upload resume to Supabase Storage if file exists
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}_${formData.fullName.replace(/\s+/g, '_')}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Resume upload error:', uploadError);
          throw new Error('Failed to upload resume. Please try again.');
        }

        resumeUrl = uploadData.path;
      }

      // Insert application into database
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_position_id: jobPositionId || null,
          job_title: jobTitle,
          location_type: jobType,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          experience: formData.experience,
          cover_letter: formData.coverLetter,
          resume_url: resumeUrl,
          status: 'pending'
        });

      if (insertError) {
        console.error('Application insert error:', insertError);
        throw new Error('Failed to submit application. Please try again.');
      }

      alert('Application submitted successfully! We will contact you soon.');
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        experience: '',
        coverLetter: '',
      });
      setResumeFile(null);
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Apply for Position</h2>
              <p className="text-gray-600 dark:text-gray-400">{jobTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-700"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setValidationErrors({ ...validationErrors, email: undefined });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-700`}
                  placeholder="name@gmail.com"
                />
              </div>
              {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone Number (10 digits) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                    setValidationErrors({ ...validationErrors, phone: undefined });
                  }}
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-3 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-700`}
                  placeholder="9876543210"
                />
              </div>
              {validationErrors.phone && <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-700"
                  placeholder="e.g., 2 years or Fresher"
                />
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Upload Resume <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-900 dark:hover:border-white transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/50"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOC, DOCX)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Cover Letter / Why do you want to join? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  required
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  rows={5}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-700 resize-none"
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
