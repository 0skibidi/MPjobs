import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../contex/AuthContext';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'employer' | 'jobseeker';
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const SignUp: React.FC = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login } = useAuth();
  const [formData, setFormData] = useState<SignUpForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker'

  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });

  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(value => value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isPasswordValid()) {
      setError('Please meet all password requirements');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      // Extract the token
      const token = response.data.accessToken;
      
      // Store in Redux
      dispatch(setCredentials({
        user: response.data.user,
        accessToken: token,
        refreshToken: response.data.refreshToken
      }));

      // Also store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Update auth context with token
      login(response.data.user, token);

      // Redirect based on role
      if (formData.role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.msg || 
        err.message || 
        'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): { text: string; color: string } => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    if (validCount <= 2) return { text: 'Weak', color: 'text-red-500' };
    if (validCount <= 4) return { text: 'Moderate', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          Create your account
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361] sm:text-sm"
                  value={formData.name}
                  onChange={handleChange}
                />
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
              {formData.password && (
                <div className="mt-2 text-sm">
                  <p className={`font-medium ${getPasswordStrength().color}`}>
                    Password Strength: {getPasswordStrength().text}
                  </p>
                  <ul className="mt-2 space-y-1 text-gray-500">
                    <li className={passwordValidation.minLength ? 'text-green-500' : ''}>
                      ✓ At least 8 characters
                    </li>
                    <li className={passwordValidation.hasUpperCase ? 'text-green-500' : ''}>
                      ✓ One uppercase letter
                    </li>
                    <li className={passwordValidation.hasLowerCase ? 'text-green-500' : ''}>
                      ✓ One lowercase letter
                    </li>
                    <li className={passwordValidation.hasNumber ? 'text-green-500' : ''}>
                      ✓ One number
                    </li>
                    <li className={passwordValidation.hasSpecial ? 'text-green-500' : ''}>
                      ✓ One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#B8A361] focus:border-[#B8A361] sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to
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
                  <option value="jobseeker">Find a Job</option>
                  <option value="employer">Post Jobs</option>
                </select>
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
                {loading ? 'Creating account...' : 'Create Account'}
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
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-[#B8A361] rounded-md shadow-sm text-sm font-medium text-[#B8A361] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361] transition-colors duration-200"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 