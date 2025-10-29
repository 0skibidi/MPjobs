import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contex/AuthContext';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
}

interface Applicant {
  _id: string;
  name: string;
  email: string;
}

interface Application {
  _id: string;
  job: Job;
  applicant: Applicant;
  resume: string;
  coverLetter?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'INTERVIEW';
  employerNotes?: string;
  createdAt: string;
}

const EmployerApplications: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [employerNotes, setEmployerNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'employer') {
      setError('You do not have permission to access this page');
      return;
    }
    
    fetchJobAndApplications();
  }, [id]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await axios.get(`/api/jobs/${id}`);
      setJob(jobResponse.data.data);
      console.log('Job data fetched:', jobResponse.data);
      
      // Fetch applications for this job using the correct endpoint
      // Use the global employer applications endpoint which will filter by company
      const applicationsResponse = await axios.get(`/api/jobs/employer/applications`);
      
      console.log('Applications data fetched:', applicationsResponse.data);
      
      // Filter applications for this specific job if needed
      let jobApplications = applicationsResponse.data.data.applications;
      if (id) {
        // Filter applications to only show those for this job
        jobApplications = jobApplications.filter(app => app.job._id === id);
      }
      
      setApplications(jobApplications);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleApplicationSelect = (application: Application) => {
    setSelectedApplication(application);
    setEmployerNotes(application.employerNotes || '');
  };

  const handleStatusUpdate = async (status: 'ACCEPTED' | 'REJECTED' | 'INTERVIEW') => {
    if (!selectedApplication) return;
    
    try {
      setActionLoading(true);
      
      const response = await axios.put(`/api/jobs/applications/${selectedApplication._id}/status`, {
        status,
        employerNotes
      });
      
      console.log('Status update response:', response.data);
      
      // Update local state
      setApplications(applications.map(app => 
        app._id === selectedApplication._id ? { ...app, status, employerNotes } : app
      ));
      
      setSelectedApplication({ ...selectedApplication, status, employerNotes });
      
    } catch (err: any) {
      console.error('Error updating application status:', err);
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'INTERVIEW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (error && user?.role !== 'employer') {
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
        {job && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/employer/dashboard')}
                className="text-[#B8A361] hover:text-[#a08c4a] font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-gray-600 mb-4">{job.company} • {job.location}</p>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Applications:</span>
              <span className="font-medium">{applications.length}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8A361]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-medium text-gray-700 mb-2">No applications yet</h2>
            <p className="text-gray-500">There are no applications for this job posting</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Applications List */}
            <div className="w-full md:w-1/2 space-y-4">
              {applications.map((application) => (
                <div 
                  key={application._id} 
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-colors duration-200 ${selectedApplication?._id === application._id ? 'ring-2 ring-[#B8A361]' : 'hover:bg-gray-50'}`}
                  onClick={() => handleApplicationSelect(application)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-medium text-gray-900">{application.applicant.name}</h2>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                      {formatStatus(application.status)}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-gray-500">{application.applicant.email}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Applied on {formatDate(application.createdAt)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Application Details */}
            <div className="w-full md:w-1/2">
              {selectedApplication ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{selectedApplication.applicant.name}</h2>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedApplication.status)}`}>
                      {formatStatus(selectedApplication.status)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                    <p className="text-gray-900">{selectedApplication.applicant.email}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Applied On</h3>
                    <p className="text-gray-900">{formatDate(selectedApplication.createdAt)}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Resume</h3>
                    <a 
                      href={`/api/uploads/${selectedApplication.resume}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Resume
                    </a>
                  </div>
                  
                  {selectedApplication.coverLetter && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h3>
                      <div className="bg-gray-50 p-4 rounded-md text-gray-600 whitespace-pre-line">
                        {selectedApplication.coverLetter}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="employerNotes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="employerNotes"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                      value={employerNotes}
                      onChange={(e) => setEmployerNotes(e.target.value)}
                      placeholder="Add notes about this applicant (optional)"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    {selectedApplication.status === 'PENDING' && (
                      <>
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
                          onClick={() => handleStatusUpdate('INTERVIEW')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Request Interview'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate('ACCEPTED')}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Accept'}
                        </button>
                      </>
                    )}
                    
                    {selectedApplication.status !== 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('PENDING')}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Reset to Pending'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <h2 className="text-xl font-medium text-gray-700 mb-2">No application selected</h2>
                  <p className="text-gray-500">Select an application from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerApplications; 