import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import ApplicationStatusBadge from '../components/common/ApplicationStatusBadge';
import { toast } from 'react-toastify';
import axios from 'axios';

interface JobApplication {
  _id: string;
  job: {
    _id: string;
    title: string;
  };
  applicant: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  resume: string;
  coverLetter?: string;
  appliedAt: string;
}

interface CompanyProfile {
  _id: string;
  name: string;
  location: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  industry: string;
  website: string;
}

const EmployerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Company profile state
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyCountry, setCompanyCountry] = useState('USA');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    console.log('EmployerDashboard - Authentication state check');
    console.log('- isAuthenticated:', isAuthenticated);
    console.log('- user:', user ? `ID: ${user.id}, Name: ${user.name}, Role: ${user.role}` : 'null');
    
    // Debug: Check token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Log first and last 10 chars of token for debugging
      console.log('Token exists in localStorage:', 
        token.substring(0, 10) + '...' + token.substring(token.length - 10));
      
      // Try to decode JWT to see what's in it (client-side only, no verification)
      try {
        // Split the token into parts
        const parts = token.split('.');
        if (parts.length === 3) {
          // Parse the payload (middle part)
          const payload = JSON.parse(atob(parts[1]));
          console.log('Decoded token payload:', payload);
          console.log('- Token expiration:', new Date(payload.exp * 1000).toLocaleString());
          console.log('- User ID in token:', payload.userId || payload.id);
          console.log('- User role in token:', payload.role);
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    } else {
      console.error('No token in localStorage despite authenticated state');
    }
    
    // Verify authentication first
    if (!isAuthenticated || !user) {
      console.error('Not authenticated or missing user data');
      setError('You must be logged in to view this page');
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }
    
    // Verify correct role
    if (user.role !== 'employer') {
      console.error('User is not an employer:', user.role);
      setError('This page is only accessible to employers');
      // Auto-redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      return;
    }
    
    // Check if token exists in localStorage (we already have token from above)
    if (!token) {
      console.error('No token in localStorage despite authenticated state');
      setError('Authentication token is missing. Please log in again.');
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }
    
    console.log('Authentication checks passed, loading data...');
    
    // Load data
    fetchApplications();
    fetchCompanyProfile();
  }, [isAuthenticated, user, navigate]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching job applications');
      
      // Directly fetch applications using axiosInstance (which handles the token)
      const applicationsResponse = await axiosInstance.get('/jobs/employer/applications');
      
      console.log('Applications response received:', applicationsResponse.status);
      console.log('Applications response data:', applicationsResponse.data);
      
      if (applicationsResponse.data?.status === 'success') {
        console.log('Success response received');
        const receivedApplications = applicationsResponse.data.data?.applications || [];
        
        // Process applications to ensure no null values cause errors
        const processedApplications = receivedApplications.map(app => ({
          _id: app._id || 'unknown',
          job: {
            _id: app.job?._id || 'unknown',
            title: app.job?.title || 'Unknown Position'
          },
          applicant: {
            _id: app.applicant?._id || 'unknown',
            name: app.applicant?.name || 'Unknown Applicant',
            email: app.applicant?.email || 'No email provided'
          },
          status: app.status || 'PENDING',
          resume: app.resume || '',
          coverLetter: app.coverLetter || '',
          appliedAt: app.appliedAt || new Date().toISOString()
        }));
        
        console.log('Processed applications:', processedApplications.length);
        setApplications(processedApplications);
        
        // Clear any previous errors since we've successfully loaded applications
        setError('');
      } else {
        console.warn('Unexpected response format:', applicationsResponse.data);
        setApplications([]);
        // Don't set an error for empty applications
      }
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error status:', err.response.status);
        
        // Set a more specific error message
        if (err.response.status === 401 || err.response.status === 403) {
          setError('Authentication required. Please log in again.');
        } else if (err.response.status >= 500) {
          // Don't set error for 500 errors - just log them
          console.error('Server error:', err.response.data?.message || 'Unknown server error');
        } else {
          setError(`Error (${err.response.status}): ${err.response.data?.message || 'Unable to load applications'}`);
        }
      } else if (err.request) {
        console.error('Error request:', err.request);
        setError('Network error: No response received from server');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message || 'Unable to load applications. Please try again later.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      if (!user || !user.id) {
        console.error('No user data available');
        return;
      }
      
      console.log('Fetching company profile for user:', user.id);
      
      // Log headers before making request for debugging
      console.log('Auth headers check before request:');
      const headers = axiosInstance.defaults.headers;
      console.log('- Default headers:', headers);
      
      // Add explicit debugging
      console.log('Making API call to /users/employer/company');
      
      // Use axiosInstance instead of direct axios call
      const response = await axiosInstance.get('/users/employer/company');
      
      console.log('Company profile response:', response.status, response.data);
      
      if (response.data?.status === 'success' && response.data.data?.company) {
        const company = response.data.data.company;
        setCompanyProfile(company);
        
        // Initialize form fields with proper null/undefined checking
        setCompanyName(company.name || '');
        setCompanyStreet(company.location?.street || '');
        setCompanyCity(company.location?.city || '');
        setCompanyState(company.location?.state || '');
        setCompanyCountry(company.location?.country || 'USA');
        
        console.log('Company profile loaded successfully:', company.name);
        
        // Check if this was a newly created company profile
        if (response.data.data?.isNewlyCreated) {
          toast.info(
            <div>
              <p>A default company profile has been created for you.</p>
              <p className="text-sm mt-1">You can edit it now to add your company details.</p>
            </div>,
            { autoClose: 8000 }
          );
          // Automatically show the profile form for editing
          setShowProfileForm(true);
        }
        
        // Check if this was a repaired company profile (data consistency issue fixed)
        if (response.data.data?.wasRepaired) {
          toast.info(
            <div>
              <p>Your company profile has been restored.</p>
              <p className="text-sm mt-1">Please verify your company information.</p>
            </div>,
            { autoClose: 8000 }
          );
          // Automatically show the profile form for editing
          setShowProfileForm(true);
        }
      } else {
        console.warn('Unexpected response format:', response.data);
        // If the response is successful but in an unexpected format, we'll try to handle it gracefully
        if (response.data && typeof response.data === 'object') {
          const company = response.data.company || response.data.data || response.data;
          if (company && company.name) {
            setCompanyProfile(company as CompanyProfile);
            setCompanyName(company.name || '');
            if (company.location) {
              setCompanyStreet(company.location.street || '');
              setCompanyCity(company.location.city || '');
              setCompanyState(company.location.state || '');
              setCompanyCountry(company.location.country || 'USA');
            }
          }
        }
      }
    } catch (apiError: any) {
      console.error('Failed to fetch company profile:', apiError);
      
      if (apiError.response) {
        console.error('Company profile fetch error:', {
          status: apiError.response.status,
          data: JSON.stringify(apiError.response.data, null, 2),
          headers: apiError.response.headers
        });
        
        if (apiError.response.status === 401) {
          // Token is likely expired, trigger logout flow
          toast.error('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setTimeout(() => {
            navigate('/login?expired=true');
          }, 1500);
        } else if (apiError.response.status === 403) {
          // User doesn't have permission
          toast.error('You don\'t have permission to access employer features.');
        } else if (apiError.response.status === 404) {
          // Company profile doesn't exist yet, but this isn't an error
          console.log('No company profile found. User may need to create one.');
          // Initialize with empty values, user can create profile
          setCompanyProfile(null);
          
          // Show a message prompting the user to create their profile
          toast.info(
            <div>
              <p>Please set up your company profile.</p>
              <p className="text-sm mt-1">This information will be used for job postings.</p>
            </div>,
            { autoClose: 8000 }
          );
          
          // Automatically show the profile form for creation
          setShowProfileForm(true);
        } else if (apiError.response.status >= 500) {
          // For 500 errors - don't show any UI error, just log it
          console.error(`Server error: ${apiError.response.data?.message || 'Unknown error'}`);
          // Don't set any toast error
        } else {
          // Other error, log but don't disrupt the user experience too much
          console.error(`Error ${apiError.response.status}: ${apiError.response.data?.message || 'Unknown error'}`);
          toast.error(`Error loading company profile: ${apiError.response.data?.message || 'Unknown error'}`);
        }
      } else if (apiError.request) {
        // Network error or no response
        console.error('Network error while fetching company profile:', apiError.request);
        toast.error('Network error. Please check your connection and try again.');
      } else {
        console.error('Error setting up request:', apiError.message);
        toast.error(`Error: ${apiError.message || 'An unexpected error occurred'}`);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSavingProfile(true);
      
      // Basic form validation
      if (!companyName.trim()) {
        toast.error('Company name is required');
        setSavingProfile(false);
        return;
      }
      
      if (!companyCity.trim() || !companyState.trim()) {
        toast.error('City and State are required');
        setSavingProfile(false);
        return;
      }
      
      const profileData = {
        name: companyName.trim(),
        location: {
          street: companyStreet.trim(),
          city: companyCity.trim(),
          state: companyState.trim(),
          country: companyCountry.trim()
        }
      };
      
      console.log('Sending company profile update with data:', profileData);
      
      // Use axiosInstance which handles authentication automatically
      const response = await axiosInstance.patch('/users/employer/company', profileData);
      
      console.log('Profile update response:', response.data);
      
      // Update local state with the returned data from server
      if (response.data?.status === 'success' && response.data.data?.company) {
        const updatedCompany = response.data.data.company;
        setCompanyProfile(updatedCompany);
        
        // Check if this was a newly created company profile during update
        if (response.data.data?.isNewlyCreated) {
          toast.success('Company profile created successfully!');
        } 
        // Check if this was a repaired company profile during update
        else if (response.data.data?.wasRepaired) {
          toast.success('Company profile has been restored and updated!');
        }
        else {
          // Normal update case
          toast.success('Company profile updated successfully!');
        }
        
        // Close form in all cases
        setShowProfileForm(false);
      } else {
        // Handle unexpected response format
        console.warn('Unexpected success response format:', response.data);
        toast.success('Profile updated, but some data may not be reflected immediately.');
        setShowProfileForm(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Check if it's an axios error with response data
      if (error.response) {
        console.error('-------------------- ERROR DETAILS --------------------');
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          
          // Clear tokens and navigate to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setTimeout(() => {
            navigate('/login?expired=true');
          }, 1500);
        } else if (error.response.status === 403) {
          toast.error('You don\'t have permission to update the company profile.');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else if (error.response.status === 400) {
          // For validation errors
          let errorMessage = error.response.data?.message || 'Invalid form data';
          if (error.response.data?.errors) {
            errorMessage = Object.values(error.response.data.errors).join(', ');
          }
          toast.error(`Validation Error: ${errorMessage}`);
        } else if (error.response.status === 500) {
          // For server errors - show more details
          const errorDetails = error.response.data?.message || 'Unknown server error';
          console.error('Server Error Details:', error.response.data);
          
          // Display a more detailed toast error
          toast.error(
            <div>
              <p>Server error occurred:</p>
              <p className="text-sm mt-1">{errorDetails}</p>
              <p className="text-xs mt-2">Error code: {error.response.status}</p>
            </div>,
            { autoClose: 6000 } // Keep it open longer
          );
          
          // Also log additional debug information
          if (error.response.data?.error) {
            console.error('Error stack:', error.response.data.error.stack);
          }
        } else {
          toast.error(
            <div>
              <p>Error ({error.response.status}):</p>
              <p className="text-sm mt-1">{error.response.data?.message || 'Failed to update company profile'}</p>
            </div>
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request or unexpected error
        toast.error('Failed to update profile. Please try again later.');
        console.error('Unexpected error details:', error.message || error);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/applications/${applicationId}/status`, { status: newStatus });
      
      console.log(`Application status updated to ${newStatus.toLowerCase()}`);
      
      // Update local state
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err: any) {
      console.error('Failed to update application status:', err.response?.data?.message || err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    status = status.toUpperCase();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}! Manage your job applications.
          </p>
        </div>

        {/* Only show error if it's not a 500 error */}
        {error && !error.includes('Error (500)') && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
            <div className="flex flex-col">
              <div className="flex-1 mb-3">
                <p className="font-bold">{error}</p>
                {error.includes('token') && (
                  <p className="mt-1">You will be redirected to the login page in a few seconds...</p>
                )}
              </div>
              <div>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Profile Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
            <button
              onClick={() => setShowProfileForm(!showProfileForm)}
              className="text-[#B8A361] hover:text-[#a08c4a] font-medium"
            >
              {showProfileForm ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          {!showProfileForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Company Name</p>
                <p className="text-base">{companyProfile?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base">
                  {companyProfile?.location?.city ? 
                    `${companyProfile.location.street ? companyProfile.location.street + ', ' : ''}${companyProfile.location.city}, ${companyProfile.location.state}, ${companyProfile.location.country}` : 
                    'Not set'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                />
              </div>
              <div>
                <label htmlFor="companyStreet" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  id="companyStreet"
                  value={companyStreet}
                  onChange={(e) => setCompanyStreet(e.target.value)}
                  placeholder="123 Main St, Suite 101"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="companyCity" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="companyCity"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  />
                </div>
                <div>
                  <label htmlFor="companyState" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="companyState"
                    value={companyState}
                    onChange={(e) => setCompanyState(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  />
                </div>
                <div>
                  <label htmlFor="companyCountry" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    id="companyCountry"
                    value={companyCountry}
                    onChange={(e) => setCompanyCountry(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 bg-[#B8A361] text-white rounded-md hover:bg-[#a08c4a] disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
          <div className="mt-4 text-sm text-gray-500">
            <p>
              <strong>Note:</strong> These company details will be automatically used when posting new jobs.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8A361]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {applications.length === 0 ? (
              <div className="p-8 text-center">
                <h2 className="text-xl font-medium text-gray-700 mb-2">No applications yet</h2>
                <p className="text-gray-500">
                  When job seekers apply to your jobs, their applications will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Position
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resume
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {application.applicant?.name || 'Unknown Applicant'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.applicant?.email || 'No email provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {application.job?.title || 'Unlisted Job'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(application.appliedAt || new Date().toISOString())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(application.status || 'PENDING')}`}>
                            {application.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {application.resume && (
                            <a
                              href={application.resume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#B8A361] hover:text-[#a08c4a]"
                            >
                              View Resume
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {application.status.toUpperCase() === 'PENDING' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleStatusChange(application._id, 'ACCEPTED')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(application._id, 'INTERVIEW')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Interview
                              </button>
                              <button
                                onClick={() => handleStatusChange(application._id, 'REJECTED')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
          <div>
            <h3 className="text-lg font-medium mb-3">Contact Support</h3>
            <p className="text-gray-600 mb-4">
              Our dedicated support team is here to help with any questions or issues you may have.
            </p>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-[#B8A361] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-medium">Email Support</p>
                  <a href="mailto:gabrielgonzalez22000088@gmail.com" className="text-[#B8A361] hover:underline">gabrielgonzalez22000088@gmail.com</a><br />
                  <a href="mailto:anthonyc00088@gmail.com" className="text-[#B8A361] hover:underline">anthonyc00088@gmail.com</a><br />
                  <a href="mailto:prodsanna@gmail.com" className="text-[#B8A361] hover:underline">prodsanna@gmail.com</a>
                  <p className="text-gray-600 mt-2">You can email these addresses for any support inquiries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;