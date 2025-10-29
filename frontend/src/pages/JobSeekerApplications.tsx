import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ApplicationStatusBadge from '../components/common/ApplicationStatusBadge';

// Application status types
type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type FilterStatus = ApplicationStatus | 'ALL';

// Application interface
interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    company: {
      _id: string;
      name: string;
    };
    location: {
      city: string;
      state: string;
    };
    jobType: string;
  };
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

const JobSeekerApplications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        console.log('Fetching user applications...');
        
        // Get query param to see if we should force refresh
        const urlParams = new URLSearchParams(window.location.search);
        const shouldRefresh = urlParams.get('refresh');
        
        // Clean URL if refresh param is present
        if (shouldRefresh) {
          window.history.replaceState({}, document.title, '/jobseeker/applications');
        }
        
        // Use the correct API endpoint based on our route structure
        const response = await axios.get('/api/jobs/user/applications');
        console.log('Application data received:', response.data);
        
        if (response.data.data && Array.isArray(response.data.data.applications)) {
          setApplications(response.data.data.applications);
          
          if (response.data.data.applications.length === 0) {
            console.log('No applications returned from API');
            // Check localStorage for cached applications
            try {
              const cachedApps = JSON.parse(localStorage.getItem('recentApplications') || '[]');
              if (cachedApps.length > 0) {
                console.log('Found cached applications in localStorage:', cachedApps.length);
                // We have cached apps but the server didn't return any.
                // This might be a timing issue, inform the user
                setError('Your recent application is being processed. It may take a moment to appear here. Please check back shortly.');
              }
            } catch (e) {
              console.error('Error reading cached applications:', e);
            }
          }
        } else {
          console.error('Invalid data format received from API', response.data);
          setError('Failed to load your applications properly. The data format was unexpected.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);
  
  // Filter applications based on selected status
  const filteredApplications = applications.filter(app => 
    statusFilter === 'ALL' ? true : app.status === statusFilter
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Application statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="font-medium text-gray-700">Total Applications</h3>
          <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="font-medium text-gray-700">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {applications.filter(app => app.status === 'PENDING').length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="font-medium text-gray-700">Accepted</h3>
          <p className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.status === 'ACCEPTED').length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="font-medium text-gray-700">Not Selected</h3>
          <p className="text-2xl font-bold text-red-600">
            {applications.filter(app => app.status === 'REJECTED').length}
          </p>
        </div>
      </div>
      
      {/* Status filter buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'ALL' 
                ? 'bg-[#B8A361] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'PENDING' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('ACCEPTED')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'ACCEPTED' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              statusFilter === 'REJECTED' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Not Selected
          </button>
        </div>
      </div>
      
      {applications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">You haven't applied to any jobs yet.</p>
          <p className="text-gray-500 mb-4">When you apply for jobs, you'll be able to track your applications here.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Browse Jobs
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">No applications match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.map((application) => (
            <div 
              key={application._id}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate(`/applications/${application._id}`)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">{application.job.title}</h2>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                
                <p className="text-gray-600 mb-3">{application.job.company.name}</p>
                <p className="text-gray-500 text-sm">{application.job.location.city}, {application.job.location.state}</p>
                <p className="text-gray-500 text-sm">{application.job.jobType}</p>
                
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  <p>Applied: {formatDate(application.createdAt)}</p>
                  <p>Last Updated: {formatDate(application.updatedAt)}</p>
                </div>
                
                <div className="mt-3 pt-2">
                  <span className="text-[#B8A361] hover:text-[#a08c4a] text-sm font-medium">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobSeekerApplications; 