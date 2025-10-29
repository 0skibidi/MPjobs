import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import JobApplicationForm from '../components/jobs/JobApplicationForm';
import { useAuth } from '../contex/AuthContext';

interface Job {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  } | string;
  jobType: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  applicationDeadline: string;
}

const JobApply: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('JobApply component mounted, id:', id);
    console.log('Current user:', user);
    console.log('Authentication status:', isAuthenticated);

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User is not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // Fetch job details
    const fetchJob = async () => {
      try {
        console.log('Fetching job details for id:', id);
        setLoading(true);
        
        const response = await axios.get(`/jobs/${id}`);
        console.log('Job details API response data:', response.data);
        
        // Simplified data extraction focusing on the most likely structure
        const jobData = response.data?.data?.job;
        
        if (!jobData) {
          console.error('Job data is missing in response:', response.data);
          setError('Job not found or has been removed');
          setLoading(false);
          return;
        }
        
        console.log('Extracted job data:', jobData);
        
        // Create a safe job object with defaults for missing fields
        const safeJob: Job = {
          _id: jobData._id || id || 'unknown',
          title: jobData.title || 'Untitled Job',
          company: {
            _id: jobData.company?._id || (typeof jobData.company === 'string' ? jobData.company : 'unknown'),
            name: jobData.company?.name || 'Unknown Company'
          },
          location: jobData.location || 'Location not specified',
          jobType: jobData.jobType || 'Not specified',
          salaryRange: {
            min: jobData.salaryRange?.min || jobData.salaryMin || 0,
            max: jobData.salaryRange?.max || jobData.salaryMax || 0,
            currency: jobData.salaryRange?.currency || 'USD'
          },
          applicationDeadline: jobData.applicationDeadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        console.log('Created safe job object:', safeJob);
        setJob(safeJob);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        
        // Simple error handling
        setError('Unable to load job details. Please try again later.');
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user, navigate, isAuthenticated]);

  console.log('JobApply render state:', { loading, error, hasJob: !!job });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8A361]"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Job not found'}
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/jobs')}
              className="text-[#B8A361] hover:underline"
            >
              Go Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Apply for Job</h1>
          <p className="text-gray-600 mt-1">Complete the form below to apply for this position</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Job Details</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-24">Job Title:</span>
              <span>{job.title}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Company:</span>
              <span>{job.company.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Location:</span>
              <span>
                {typeof job.location === 'object' 
                  ? `${job.location.city}, ${job.location.state}${job.location.remote ? ' (Remote available)' : ''}` 
                  : job.location}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Job Type:</span>
              <span>{job.jobType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Salary:</span>
              <span>
                {job.salaryRange ? 
                  `${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} per year` : 
                  'Not specified'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Deadline:</span>
              <span>{new Date(job.applicationDeadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <JobApplicationForm 
          jobId={job._id} 
          jobTitle={job.title} 
          onCancel={() => navigate('/jobs')}
        />
      </div>
    </div>
  );
};

export default JobApply; 