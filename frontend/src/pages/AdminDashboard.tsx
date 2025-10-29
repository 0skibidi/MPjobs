import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Job } from '../types/job';
import { JobStatus } from '../types/enums';
import { useAuth } from '../contex/AuthContext';
import { useSelector } from 'react-redux';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth(); // Get user from auth context
  const authState = useSelector((state: any) => state.auth); // Get auth state from Redux
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedJobAction, setSelectedJobAction] = useState<{
    jobId: string;
    status: JobStatus;
    jobTitle: string;
  } | null>(null);
  const [showPendingJobs, setShowPendingJobs] = useState(false);

  useEffect(() => {
    // Check if user is logged in as admin
    const checkAuth = () => {
      if (!user && !authState.user) {
        setError('Please log in to access this page');
        setLoading(false);
        return false;
      }
      
      const userRole = user?.role || authState.user?.role;
      if (userRole !== 'admin') {
        setError(`Access denied. You need admin privileges (current role: ${userRole || 'none'})`);
        setLoading(false);
        return false;
      }
      
      return true;
    };
    
    if (checkAuth()) {
      fetchJobs();
      checkPendingJobs();
    }
  }, [user, authState]);

  // Check for pending jobs and notify admin
  const checkPendingJobs = async () => {
    try {
      const response = await axios.get('/jobs', {
        params: { 
          status: JobStatus.PENDING,
          limit: 5 // Check if there are any pending jobs
        }
      });
      
      if (response.data?.data?.jobs && response.data.data.jobs.length > 0) {
        setSuccessMessage(`There are ${response.data.data.jobs.length} pending jobs waiting for approval. Click "Fetch Pending Jobs" to review them.`);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 10000);
      }
    } catch (err) {
      // Silently fail - this is just a convenience check
      console.error('Error checking pending jobs:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/jobs/admin/jobs');
      
      if (response.data?.data?.jobs) {
        setJobs(response.data.data.jobs);
      } else {
        setError('Unexpected API response format');
      }
    } catch (err: any) {
      setError(`Failed to fetch jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch pending jobs
  const fetchPendingJobs = async () => {
    try {
      setPendingLoading(true);
      
      const response = await axios.get('/jobs', {
        params: { 
          status: JobStatus.PENDING,
          limit: 10 
        }
      });
      
      if (response.data?.data?.jobs) {
        setPendingJobs(response.data.data.jobs);
      } else {
        setError('Unexpected API response format from pending jobs');
      }
    } catch (err: any) {
      setError(`Failed to fetch pending jobs: ${err.message}`);
    } finally {
      setPendingLoading(false);
    }
  };
  
  // Function to toggle the pending jobs section
  const togglePendingJobs = () => {
    if (!showPendingJobs) {
      fetchPendingJobs();
    }
    setShowPendingJobs(!showPendingJobs);
  };
  
  // Function to approve a job from the pending jobs list
  const approvePendingJob = async (jobId: string) => {
    try {
      setLoading(true);
      await axios.patch(`/jobs/admin/jobs/${jobId}/status`, { status: JobStatus.APPROVED });
      
      // Remove from pendingJobs and add to jobs with updated status
      const approvedJob = pendingJobs.find(job => job._id === jobId);
      if (approvedJob) {
        const updatedJob = { ...approvedJob, status: JobStatus.APPROVED };
        setPendingJobs(pendingJobs.filter(job => job._id !== jobId));
        
        // Add the approved job to the main jobs list if not already there
        if (!jobs.some(job => job._id === jobId)) {
          setJobs([updatedJob, ...jobs]);
        } else {
          setJobs(jobs.map(job => job._id === jobId ? { ...job, status: JobStatus.APPROVED } : job));
        }
        
        // Show success message
        setSuccessMessage(`Job "${approvedJob.title}" was successfully approved and will appear in Find Jobs.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (err: any) {
      setError(`Failed to approve job: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmStatusUpdate = (jobId: string, newStatus: JobStatus, jobTitle: string) => {
    setSelectedJobAction({ jobId, status: newStatus, jobTitle });
    setShowConfirmation(true);
  };

  const handleStatusUpdate = async (jobId: string, newStatus: JobStatus) => {
    try {
      setLoading(true);
      await axios.patch(`/jobs/admin/jobs/${jobId}/status`, { status: newStatus });
      
      // Update local state
      setJobs(jobs.map(job => 
        job._id === jobId ? { ...job, status: newStatus } : job
      ));
      
      // Remove from pending jobs if present
      if (pendingJobs.some(job => job._id === jobId)) {
        setPendingJobs(pendingJobs.filter(job => job._id !== jobId));
      }
      
      // Close confirmation modal
      setShowConfirmation(false);
      setSelectedJobAction(null);
      
      // Show success message
      const job = jobs.find(job => job._id === jobId);
      if (job) {
        setSuccessMessage(`Job "${job.title}" status was updated to ${newStatus}.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      setError(`Failed to update job status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await axios.delete(`/jobs/admin/jobs/${jobId}`);
      // Remove from local state
      setJobs(jobs.filter(job => job._id !== jobId));
      
      // Remove from pending jobs if present
      if (pendingJobs.some(job => job._id === jobId)) {
        setPendingJobs(pendingJobs.filter(job => job._id !== jobId));
      }
    } catch (err: any) {
      setError('Failed to delete job');
    }
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const filteredJobs = filter === 'ALL' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  const getStatusBadgeColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case JobStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case JobStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Modal for job details
  const JobDetailsModal = () => {
    if (!showModal || !selectedJob) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
            <button 
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {/* Status Badge */}
            <div className="mb-6 flex items-center">
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeColor(selectedJob.status)}`}>
                {selectedJob.status}
              </span>
              <span className="ml-4 text-gray-500">Posted on {formatDate(selectedJob.createdAt)}</span>
            </div>

            {/* Two-column layout for desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main content - 2/3 width on desktop */}
              <div className="md:col-span-2 space-y-6">
                {/* Company Info */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Company Information</h3>
                  <p><span className="font-medium">Name:</span> {selectedJob.company.name}</p>
                  {selectedJob.company.logo && (
                    <img 
                      src={selectedJob.company.logo} 
                      alt={`${selectedJob.company.name} logo`}
                      className="mt-2 h-16 object-contain"
                    />
                  )}
                </div>
                
                {/* Job Description */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Job Description</h3>
                  <p className="whitespace-pre-line">{selectedJob.description}</p>
                </div>
                
                {/* Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Requirements</h3>
                    <ul className="list-disc pl-5">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Sidebar - 1/3 width on desktop */}
              <div className="space-y-6">
                {/* Job Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Job Details</h3>
                  
                  <div className="space-y-2">
                    <p><span className="font-medium">Job Type:</span> {formatJobType(selectedJob.jobType)}</p>
                    
                    <p><span className="font-medium">Location:</span> {selectedJob.location?.city}, {selectedJob.location?.country} {selectedJob.location?.remote && '(Remote)'}</p>
                    
                    <p>
                      <span className="font-medium">Salary Range:</span> {formatSalary(
                        selectedJob.salaryRange?.min || 0, 
                        selectedJob.salaryRange?.max || 0,
                        selectedJob.salaryRange?.currency
                      )}
                    </p>
                    
                    {selectedJob.applicationDeadline && (
                      <p>
                        <span className="font-medium">Application Deadline:</span> {formatDate(selectedJob.applicationDeadline)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Skills */}
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="bg-[#f3f0e6] text-[#B8A361] px-2 py-1 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                {selectedJob.status === JobStatus.PENDING && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Actions</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          closeModal();
                          confirmStatusUpdate(selectedJob._id, JobStatus.APPROVED, selectedJob.title);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex-1"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          closeModal();
                          confirmStatusUpdate(selectedJob._id, JobStatus.REJECTED, selectedJob.title);
                        }}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex-1"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!showConfirmation || !selectedJobAction) return null;
    
    const isApproval = selectedJobAction.status === JobStatus.APPROVED;
    const actionText = isApproval ? 'approve' : 'reject';
    const buttonClass = isApproval ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
          <p className="mb-6">
            Are you sure you want to {actionText} the job "{selectedJobAction.jobTitle}"?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusUpdate(selectedJobAction.jobId, selectedJobAction.status)}
              className={`px-4 py-2 text-white rounded ${buttonClass}`}
            >
              {isApproval ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Admin Dashboard</h1>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-[#B8A361] text-white rounded hover:bg-[#a08c4a] transition-colors"
              disabled={loading}
            >
              Refresh Jobs
            </button>
            
            <button
              onClick={togglePendingJobs}
              className={`px-4 py-2 ${showPendingJobs ? 'bg-black hover:bg-gray-800' : 'bg-[#B8A361] hover:bg-[#a08c4a]'} text-white rounded transition-colors`}
            >
              {showPendingJobs ? 'Hide Pending Jobs' : 'Fetch Pending Jobs'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              className="ml-2 text-red-700 font-bold" 
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
            <span>{successMessage}</span>
            <button 
              className="ml-2 text-green-700 font-bold" 
              onClick={() => setSuccessMessage('')}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Pending Jobs Section */}
        {showPendingJobs && (
          <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-[#B8A361] px-6 py-3">
              <h2 className="text-lg font-medium text-white">Pending Jobs</h2>
            </div>
            
            {pendingLoading ? (
              <div className="p-4 text-center">Loading pending jobs...</div>
            ) : pendingJobs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No pending jobs available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingJobs.map(job => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {job.title}
                            <button
                              onClick={() => openJobDetails(job)}
                              className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.company ? job.company.name : 'Unknown Company'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(job.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => approvePendingJob(job._id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => confirmStatusUpdate(job._id, JobStatus.REJECTED, job.title)}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Existing job list section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as JobStatus | 'ALL')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8A361]"
              >
                <option value="ALL">All Status</option>
                <option value={JobStatus.PENDING}>Pending</option>
                <option value={JobStatus.APPROVED}>Approved</option>
                <option value={JobStatus.REJECTED}>Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No jobs found with the selected status
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {job.title}
                            <button
                              onClick={() => openJobDetails(job)}
                              className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                            >
                              Information
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.company.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {job.status === JobStatus.PENDING && (
                            <>
                              <button
                                onClick={() => confirmStatusUpdate(job._id, JobStatus.APPROVED, job.title)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => confirmStatusUpdate(job._id, JobStatus.REJECTED, job.title)}
                                className="text-red-600 hover:text-red-900 ml-2"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {job.status === JobStatus.APPROVED && (
                            <span className="text-green-600">Approved</span>
                          )}
                          {job.status === JobStatus.REJECTED && (
                            <span className="text-red-600">Rejected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Render the job details modal */}
      <JobDetailsModal />
      
      {/* Render confirmation dialog */}
      <ConfirmationDialog />
    </div>
  );
};

export default AdminDashboard; 