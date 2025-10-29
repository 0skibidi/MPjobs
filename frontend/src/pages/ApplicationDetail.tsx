import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ApplicationStatusBadge from '../components/common/ApplicationStatusBadge';

// Application status type
type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

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
    description: string;
    location: {
      city: string;
      state: string;
      country: string;
      remote: boolean;
    };
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    jobType: string;
    status: string;
  };
  status: ApplicationStatus;
  resume: string;
  coverLetter?: string;
  employerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/applications/${id}`);
        setApplication(response.data.data.application);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application:', err);
        setError('Failed to load application details');
        setLoading(false);
      }
    };
    
    fetchApplication();
  }, [id]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle application withdrawal
  const handleWithdrawApplication = async () => {
    if (!application) return;
    
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/applications/${application._id}`);
      navigate('/applications');
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError('Failed to withdraw application');
    }
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
  
  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Application not found'}
        </div>
        <button
          onClick={() => navigate('/applications')}
          className="text-[#B8A361] hover:underline font-medium"
        >
          ← Back to My Applications
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/applications')}
        className="text-[#B8A361] hover:underline font-medium flex items-center mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to My Applications
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{application.job.title}</h1>
            <ApplicationStatusBadge status={application.status} />
          </div>
          
          <p className="text-gray-700 mt-2">{application.job.company.name}</p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Application Details */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Application Details</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-2"><span className="font-medium">Applied:</span> {formatDate(application.createdAt)}</p>
                <p className="mb-2"><span className="font-medium">Last Updated:</span> {formatDate(application.updatedAt)}</p>
                
                {application.status === 'ACCEPTED' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded text-green-800">
                    <p className="font-medium">Congratulations!</p>
                    <p>Your application has been accepted. The employer will contact you with next steps.</p>
                  </div>
                )}
                
                {application.status === 'REJECTED' && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-gray-700">
                    <p className="font-medium">Application Not Selected</p>
                    <p>Thank you for your interest. The employer has decided to pursue other candidates at this time.</p>
                  </div>
                )}
                
                {application.employerNotes && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Employer Notes:</h3>
                    <p className="italic text-gray-700 bg-gray-100 p-3 rounded">{application.employerNotes}</p>
                  </div>
                )}
              </div>
              
              {application.status === 'PENDING' && (
                <div className="mt-4">
                  <button
                    onClick={handleWithdrawApplication}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded font-medium transition-colors duration-200"
                  >
                    Withdraw Application
                  </button>
                </div>
              )}
            </div>
            
            {/* Job Details */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Job Details</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-2"><span className="font-medium">Location:</span> {application.job.location.city}, {application.job.location.state}</p>
                <p className="mb-2"><span className="font-medium">Job Type:</span> {application.job.jobType}</p>
                <p className="mb-2">
                  <span className="font-medium">Salary Range:</span> 
                  {application.job.salaryRange.currency} 
                  {application.job.salaryRange.min.toLocaleString()} - 
                  {application.job.salaryRange.max.toLocaleString()}
                </p>
                
                {application.job.location.remote && (
                  <p className="mb-2"><span className="font-medium">Remote:</span> Yes</p>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Job Description:</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-700 whitespace-pre-line">{application.job.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail; 