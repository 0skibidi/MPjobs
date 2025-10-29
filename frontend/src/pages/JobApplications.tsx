import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { jobsService } from '../api/services/jobsService';
import { applicationService } from '../api/services/applicationService';
import { Application, Job } from '../types/models';
import { ApplicationStatus } from '../types/enums';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ApplicationStatusBadge from '../components/common/ApplicationStatusBadge';

const JobApplications: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchJobAndApplications = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [jobData, applicationsData] = await Promise.all([
          jobsService.getJobById(id),
          applicationService.getApplicationsByJobId(id)
        ]);
        
        setJob(jobData.job);
        setApplications(applicationsData.applications);
      } catch (error) {
        console.error('Error fetching job applications:', error);
        navigate('/employer/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndApplications();
  }, [id, navigate]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setProcessing(true);
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">Job not found</p>
          <button
            onClick={() => navigate('/employer/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Applications for {job.title}</h1>
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition duration-200"
        >
          Back to Dashboard
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">No applications received for this job posting yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {applications.length} {applications.length === 1 ? 'Application' : 'Applications'} Received
            </h3>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {applications.map((application) => (
              <div key={application.id} className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium">{application.user.name}</h4>
                    <p className="text-sm text-gray-500">{application.user.email}</p>
                    <p className="text-sm text-gray-500">Applied on: {formatDate(application.createdAt)}</p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h5>
                  <p className="text-gray-600 whitespace-pre-line">{application.coverLetter}</p>
                </div>

                {application.resumeUrl && (
                  <div className="mt-3">
                    <a 
                      href={application.resumeUrl} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                <div className="mt-4 flex space-x-3">
                  {application.status === ApplicationStatus.PENDING && (
                    <>
                      <button
                        onClick={() => handleStatusChange(application.id, ApplicationStatus.APPROVED)}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-70"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(application.id, ApplicationStatus.REJECTED)}
                        disabled={processing}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-70"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {application.status === ApplicationStatus.APPROVED && (
                    <button
                      onClick={() => handleStatusChange(application.id, ApplicationStatus.INTERVIEWED)}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-70"
                    >
                      Mark as Interviewed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications; 