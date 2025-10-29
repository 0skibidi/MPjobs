import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ 
  jobId, 
  jobTitle, 
  onSuccess, 
  onCancel 
}) => {
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('JobApplicationForm mounted with jobId:', jobId);
    console.log('JobApplicationForm mounted with jobTitle:', jobTitle);
  }, [jobId, jobTitle]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('File size should not exceed 5MB');
        return;
      }
      
      setResume(file);
      setError('');
      console.log('Resume file selected:', file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!resume) {
      setError('Please upload your resume');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('resume', resume);
      
      if (coverLetter.trim()) {
        formData.append('coverLetter', coverLetter);
      }
      
      console.log('Sending application for jobId:', jobId);
      console.log('FormData contents:', {
        resume: resume.name,
        hasCoverLetter: !!coverLetter.trim()
      });
      
      const response = await axios.post(`/jobs/${jobId}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Application submitted successfully:', response.data);
      
      if (onSuccess) {
        onSuccess();
      } else {
        console.log('Redirecting to applications page in 3 seconds');
        // Display success message
        setError('');
        setSubmitting(false);
        
        // Replace the form with a success message
        const formElement = document.getElementById('application-form');
        if (formElement) {
          formElement.innerHTML = `
            <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-6 rounded mb-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-lg font-medium mb-2">Application Submitted Successfully!</h3>
              <p class="mb-4">Your application has been sent to the employer and will appear in their dashboard.</p>
              <p class="text-sm">You will be redirected to your applications page shortly...</p>
            </div>
          `;
        }
        
        // Store application ID if returned from API
        if (response.data?.data?.applicationId) {
          try {
            // Get existing applications from localStorage or initialize as empty array
            const existingApps = JSON.parse(localStorage.getItem('recentApplications') || '[]');
            
            // Add this application 
            existingApps.push({
              id: response.data.data.applicationId,
              jobId,
              jobTitle,
              date: new Date().toISOString()
            });
            
            // Save back to localStorage
            localStorage.setItem('recentApplications', JSON.stringify(existingApps));
            console.log('Saved application to localStorage cache');
          } catch (storageError) {
            console.error('Failed to cache application ID:', storageError);
          }
        }
        
        setTimeout(() => {
          // Force refresh the cache when navigating to applications page
          navigate('/jobseeker/applications?refresh=' + new Date().getTime());
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error applying for job:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Response error data:', err.response.data);
        console.error('Response error status:', err.response.status);
        
        // Show validation errors from the server in the form UI
        if (err.response.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to submit application. Please try again.');
        }
      } else if (err.request) {
        console.error('Request error:', err.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Error message:', err.message);
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Apply for {jobTitle}</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form id="application-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Resume Builder Resources Section */}
        <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-md font-medium text-gray-800 mb-2">Need help creating a professional resume?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Before uploading your resume, you might want to use one of these resume builders to create or improve your resume:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="https://builder.resume.co/resume-creation-menu" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Resume.co Builder
            </a>
            <a 
              href="https://www.myperfectresume.com/build-resume/experience-level" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Perfect Resume
            </a>
          </div>
        </div>

        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
            Resume (PDF only, max 5MB) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="resume"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#B8A361] file:text-white hover:file:bg-[#a08c4a]"
            required
          />
          {resume && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {resume.name}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
            Cover Letter (Optional)
          </label>
          <textarea
            id="coverLetter"
            rows={6}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the employer why you're a good fit for this position..."
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel || (() => navigate('/jobs'))}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !resume}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobApplicationForm; 