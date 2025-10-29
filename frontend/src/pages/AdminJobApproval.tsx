import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import { useSelector } from 'react-redux';

interface Job {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
    logo: string;
  };
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string[];
  skills: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  postedBy: {
    _id: string;
    name: string;
    email: string;
  };
}

const AdminJobApproval: React.FC = () => {
  const { user } = useAuth();
  const authState = useSelector((state: any) => state.auth); // Get auth state from Redux
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Removed bulk deletion variables
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check if user is logged in as admin from either context or Redux
    const userRole = user?.role || authState.user?.role;
    
    if (userRole !== 'admin') {
      setError(`You do not have permission to access this page. Current role: ${userRole || 'none'}`);
      return;
    }
    
    fetchJobs();
  }, [statusFilter, user, authState]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/jobs/admin/jobs', {
        params: { status: statusFilter }
      });
      
      // Log the response data to help debug company information issues
      console.log('Admin jobs response:', response.data);
      
      // Process job data to ensure company information is properly displayed
      const processedJobs = response.data.data.jobs.map((job: Job) => {
        // Make sure company information is properly handled
        if (!job.company || typeof job.company !== 'object') {
          // If company is missing or not an object, try to look for company name elsewhere
          console.warn(`Job ${job._id} has invalid company data:`, job.company);
          // Set default company with a clear indication it needs attention
          return {
            ...job,
            company: {
              _id: job.company || '000000000000000000000000',
              name: 'Company data missing - Please check',
              logo: ''
            }
          };
        }
        return job;
      });
      
      setJobs(processedJobs);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch jobs: ${err.message}`);
      setLoading(false);
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setAdminNotes('');
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedJob) return;
    
    try {
      setActionLoading(true);
      
      const url = `/jobs/admin/jobs/${selectedJob._id}/status`;
      
      await axios.patch(url, {
        status,
        adminNotes
      });
      
      // Update local state
      setJobs(jobs.filter(job => job._id !== selectedJob._id));
      setSelectedJob(null);
      setAdminNotes('');
      setSuccessMessage(`Job ${status.toLowerCase()} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to update job status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatSalary = (min: number, max: number, currency: string = 'USD') => {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  if (error && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Job Approval</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage job postings submitted by employers. Review and approve or reject submissions.
          </p>
        </div>
        
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8A361]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="text-gray-500">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8A361]"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-medium text-gray-700 mb-2">No jobs found</h2>
            <p className="text-gray-500">There are no jobs with the selected status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Job List */}
            <div className="w-full md:w-1/2 space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job._id} 
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-colors duration-200 ${selectedJob?._id === job._id ? 'ring-2 ring-[#B8A361]' : 'hover:bg-gray-50'}`}
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-medium text-gray-900">{job.title}</h2>
                    <span className="text-sm text-gray-500">{formatDate(job.createdAt)}</span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-medium">Company:</span> 
                    <span className={job.company.name === 'Unknown Company' || job.company.name === 'Company info unavailable' ? 'text-red-600 font-semibold' : ''}>
                      {job.company.name}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatJobType(job.jobType)}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500">
                      Posted by: {job.postedBy?.name || 'Unknown'}
                    </div>
                    <a
                      href={`/jobs/${job._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Job Details */}
            <div className="w-full md:w-1/2">
              {selectedJob ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedJob.title}</h2>
                  
                  {/* Status Badge */}
                  <div className="mb-6">
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full 
                      ${selectedJob.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        selectedJob.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {selectedJob.status}
                    </span>
                    <a
                      href={`/jobs/${selectedJob._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-blue-600 hover:text-blue-900 text-sm"
                    >
                      View Job Details
                    </a>
                  </div>
                  
                  {/* Company Info */}
                  <div className="mb-6 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Company</h3>
                    <p className="mb-2">
                      <span className="font-medium">Name:</span> 
                      <span className={selectedJob.company.name === 'Unknown Company' || selectedJob.company.name === 'Company info unavailable' ? 'text-red-600 font-semibold' : ''}>
                        {selectedJob.company.name}
                      </span>
                      {(selectedJob.company.name === 'Unknown Company' || selectedJob.company.name === 'Company info unavailable') && (
                        <span className="text-xs text-red-600 ml-2">
                          (Company data needs to be updated)
                        </span>
                      )}
                    </p>
                    {selectedJob.company.logo && (
                      <img 
                        src={selectedJob.company.logo} 
                        alt={`${selectedJob.company.name} logo`}
                        className="h-16 object-contain"
                      />
                    )}
                  </div>
                  
                  {/* Job Description */}
                  <div className="mb-6 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Job Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">Location</h4>
                        <p>{selectedJob.location}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Job Type</h4>
                        <p>{formatJobType(selectedJob.jobType)}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Salary Range</h4>
                        <p>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Job Description */}
                  <div className="mb-6 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">{selectedJob.description}</p>
                  </div>
                  
                  {/* Requirements */}
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Requirements</h3>
                      <ul className="list-disc pl-5 text-gray-600">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Skills */}
                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Posted By */}
                  <div className="mb-6 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Posted By</h3>
                    <p className="text-gray-900">{selectedJob.postedBy?.name || 'Unknown'}</p>
                    {selectedJob.postedBy?.email && (
                      <p className="text-gray-500 text-sm">{selectedJob.postedBy.email}</p>
                    )}
                  </div>
                  
                  {statusFilter === 'PENDING' && (
                    <>
                      <div className="mb-4">
                        <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Notes
                        </label>
                        <textarea
                          id="adminNotes"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about this job (optional)"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate('REJECTED')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate('APPROVED')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Approve'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <h2 className="text-xl font-medium text-gray-700 mb-2">No job selected</h2>
                  <p className="text-gray-500">Select a job from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJobApproval; 