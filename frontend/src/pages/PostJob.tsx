import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contex/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';

interface JobFormData {
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'VOLUNTEERING' | 'INTERNSHIP';
  description: string;
  requirements: string[];
  salaryMin: number;
  salaryMax: number;
  applicationDeadline?: string;
  applicationEmail: string;
  skills: string[];
}

// Add the CompanyProfile interface
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

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [skills, setSkills] = useState<string[]>(['']);
  const [successSubmission, setSuccessSubmission] = useState(false);
  const [submittedJob, setSubmittedJob] = useState<{title: string, id: string} | null>(null);
  
  // Add company profile state
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: user?.company || '',
    location: '',
    type: 'FULL_TIME',
    description: '',
    requirements: [],
    skills: [],
    salaryMin: 0,
    salaryMax: 0,
    applicationDeadline: undefined,
    applicationEmail: user?.email || '',
  });

  // Add useEffect to fetch company profile
  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  // Add function to fetch company profile
  const fetchCompanyProfile = async () => {
    try {
      setLoadingProfile(true);
      
      const response = await axiosInstance.get('/users/employer/company');
      
      if (response.data?.status === 'success' && response.data.data?.company) {
        const company = response.data.data.company;
        setCompanyProfile(company);
        
        // Update form with company data
        setFormData(prev => ({
          ...prev,
          company: company.name || prev.company,
          location: company.location ? 
            `${company.location.street ? company.location.street + ', ' : ''}${company.location.city}, ${company.location.state}, ${company.location.country}` : 
            prev.location
        }));
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingProfile(false);
    }
  };

  // Sync requirements with formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      requirements: requirements
    }));
  }, [requirements]);

  // Sync skills with formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      skills: skills
    }));
  }, [skills]);

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };

  const removeSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccessSubmission(false);

    try {
      // Check for required fields
      if (!formData.title) {
        throw new Error('Job title is required');
      }
      if (!formData.description) {
        throw new Error('Job description is required');
      }
      if (!formData.location) {
        throw new Error('Location is required');
      }
      if (formData.salaryMin <= 0 || formData.salaryMax <= 0) {
        throw new Error('Salary range must be greater than zero');
      }
      if (formData.salaryMin > formData.salaryMax) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
      if (!formData.applicationDeadline) {
        throw new Error('Application deadline is required');
      }
      if (!formData.applicationEmail) {
        throw new Error('Application email is required');
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.applicationEmail)) {
        throw new Error('Please provide a valid email address');
      }

      // Filter out empty entries
      const filteredRequirements = formData.requirements.filter(req => req.trim() !== '');
      const filteredSkills = formData.skills.filter(skill => skill.trim() !== '');

      // Simplify location handling
      const isRemote = formData.location.toLowerCase().includes('remote');
      const submitData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        skills: formData.skills,
        location: {
          city: formData.location,
          remote: isRemote
        },
        jobType: formData.type,
        salaryRange: {
          min: formData.salaryMin,
          max: formData.salaryMax,
          currency: 'USD'
        },
        applicationDeadline: formData.applicationDeadline,
        applicationEmail: formData.applicationEmail
      };

      // Let the axios interceptor handle the token from Redux store
      // No need to manually get token from localStorage
      const response = await axiosInstance.post('/jobs', submitData);
      
      // Set success state
      setSuccessSubmission(true);
      setSubmittedJob({
        title: formData.title,
        id: response.data.data.job._id
      });
      
      // Show success message before redirecting
      toast.success(
        "Job submitted successfully! Your job posting has been submitted to administrators for review.",
        { autoClose: 5000 }
      );
      
      // Don't automatically redirect - let the user click on the dashboard link
    } catch (err: any) {
      console.error('Error posting job:', err);
      setError(err.response?.data?.message || 'Failed to post job');
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  // If job submission was successful, show success message
  if (successSubmission && submittedJob) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Job Submitted Successfully!</h2>
          <p className="text-xl text-gray-600 mb-6">"{submittedJob.title}" has been submitted for review.</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Please note:</strong> Your job posting will be reviewed by our administrators and must be approved before becoming visible to job seekers.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-8">
            You can track the status of your job posting from your employer dashboard.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/employer/dashboard')}
              className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setSuccessSubmission(false);
                setSubmittedJob(null);
                const newLocation = companyProfile?.location ? 
                  `${companyProfile.location.street ? companyProfile.location.street + ', ' : ''}${companyProfile.location.city}, ${companyProfile.location.state}, ${companyProfile.location.country}` : 
                  '';
                
                setFormData({
                  title: '',
                  company: companyProfile?.name || user?.company || '',
                  location: newLocation,
                  type: 'FULL_TIME',
                  description: '',
                  requirements: [],
                  skills: [],
                  salaryMin: 0,
                  salaryMax: 0,
                  applicationDeadline: undefined,
                  applicationEmail: user?.email || '',
                });
                setRequirements(['']);
                setSkills(['']);
              }}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Post Another Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="mt-1 flex">
                <input
                  type="text"
                  id="company"
                  required
                  readOnly
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 cursor-not-allowed"
                  value={formData.company}
                />
                {loadingProfile && (
                  <div className="ml-2 flex items-center">
                    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-[#B8A361] rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Company name is set in your profile and cannot be changed here. You can update it in your <a href="/employer/dashboard" className="text-[#B8A361] hover:underline">dashboard</a>.
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                id="description"
                required
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                    value={req}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder="Enter a requirement"
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="text-[#B8A361] hover:text-[#a08c4a] text-sm font-medium"
              >
                + Add Requirement
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              {skills.map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    placeholder="Enter a skill"
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSkill}
                className="text-[#B8A361] hover:text-[#a08c4a] text-sm font-medium"
              >
                + Add Skill
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1 flex">
                  <input
                    type="text"
                    id="location"
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  {companyProfile?.location && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          location: `${companyProfile.location.street ? companyProfile.location.street + ', ' : ''}${companyProfile.location.city}, ${companyProfile.location.state}, ${companyProfile.location.country}`
                        });
                      }}
                      className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-300 hover:bg-gray-200"
                      title="Use company location from your profile"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  You can customize the location for each job posting. Include street address, suite/unit number, city, state, ZIP code and country for precise location information.
                </p>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Employment Type
                </label>
                <select
                  id="type"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="VOLUNTEERING">Volunteering</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>

              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  id="salaryMin"
                  required
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                />
              </div>

              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  id="salaryMax"
                  required
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: Number(e.target.value) })}
                />
              </div>

              <div>
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">
                  Application Deadline
                </label>
                <input
                  type="date"
                  id="applicationDeadline"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="applicationEmail" className="block text-sm font-medium text-gray-700">
                Application Email
              </label>
              <input
                type="email"
                id="applicationEmail"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361]"
                value={formData.applicationEmail}
                onChange={(e) => setFormData({ ...formData, applicationEmail: e.target.value })}
                placeholder="hr@company.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Job seekers will be directed to email their applications to this address. Make sure this is a valid email that you check regularly.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob; 