import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

interface LoginForm {
  email: string;
  password: string;
  role: 'admin' | 'employer' | 'jobseeker';
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    role: 'jobseeker'
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Attempting to log in with:', { email: formData.email, role: formData.role });

    try {
      console.log('Making login request to:', `${axiosInstance.defaults.baseURL}/auth/login`);
      const startTime = Date.now();
      
      const response = await axiosInstance.post('/auth/login', formData);
      
      const endTime = Date.now();
      console.log(`Login request completed in ${endTime - startTime}ms`);

      // Extract the token from the response
      const token = response.data.accessToken;
      console.log('Login successful, token received:', token ? 'Yes' : 'No');

      // Store tokens in Redux
      dispatch(setCredentials({
        user: response.data.user,
        accessToken: token,
        refreshToken: response.data.refreshToken
      }));

      // Store tokens in localStorage as backup
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Update auth context - pass token as second parameter
      login(response.data.user, token);
      console.log('Authentication context updated, redirecting based on role:', response.data.user.role);
      
      // Redirect based on role
      if (response.data.user.role === 'employer') {
        navigate('/employer/dashboard');
      } else if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server is taking too long to respond. Please try again later.');
      } else if (err.response) {
        // The request was made and the server responded with a status code outside of 2xx
        console.error('Error response:', {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        });
        setError(
          err.response.data?.message || 
          err.response.data?.errors?.[0]?.msg || 
          `Server error: ${err.response.status}` ||
          'Invalid email or password'
        );
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', err.message);
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          Log in to your account
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361] sm:text-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="jobseeker">Job Seeker</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361] sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361] sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/signup')}
                className="w-full flex justify-center py-2 px-4 border border-[#B8A361] rounded-md shadow-sm text-sm font-medium text-[#B8A361] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] transition-colors duration-200"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 