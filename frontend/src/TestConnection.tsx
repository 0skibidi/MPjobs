import React, { useEffect, useState } from 'react';
import axios from './api/axios';

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection to backend...');
        
        // First try the test endpoint
        const testResponse = await axios.get('/jobs/test');
        console.log('Test endpoint response:', testResponse.data);
        
        if (testResponse.data.status === 'success') {
          setStatus('success');
          setMessage('Successfully connected to backend test endpoint!');
          return;
        }
        
        // If test endpoint doesn't give expected response, try jobs endpoint
        const jobsResponse = await axios.get('/jobs');
        console.log('Jobs endpoint response:', jobsResponse.data);
        
        setStatus('success');
        setMessage(`Successfully connected to backend jobs endpoint! Found ${jobsResponse.data.results || 0} jobs.`);
      } catch (err: any) {
        console.error('Connection test failed:', err);
        
        setStatus('error');
        setError(
          err.response 
            ? `Error ${err.response.status}: ${err.response.data?.message || err.message}` 
            : `Network error: ${err.message}`
        );
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8 max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Backend Connection Test</h1>
      
      {status === 'loading' && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B8A361]"></div>
          <span className="ml-2">Testing connection...</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="font-medium">Connection Successful!</p>
          <p className="text-sm">{message}</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Connection Failed</p>
          <p className="text-sm">{error}</p>
          <div className="mt-4">
            <p className="text-sm font-medium">Troubleshooting steps:</p>
            <ul className="list-disc pl-5 text-sm mt-2">
              <li>Verify the backend server is running on port 5004</li>
              <li>Check for any CORS issues in the console</li>
              <li>Ensure the API_URL in axios.ts is correct</li>
              <li>Restart both frontend and backend servers</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-gray-600 text-sm">
        <p>Current API URL: <code className="bg-gray-100 px-1 py-0.5 rounded">{axios.defaults.baseURL}</code></p>
      </div>
    </div>
  );
};

export default TestConnection; 