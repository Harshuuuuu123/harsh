import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://69.62.85.17:5000';


export default function LoginSignup() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState(''); // ✅ added
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'lawyer' | 'user'>('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name: signupName, // ✅ send name
        email: signupEmail,
        password: signupPassword,
        role: signupRole
      });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      alert('Signup successful!');
      setActiveTab('login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-blue-500 flex items-center justify-center px-4">
  <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 overflow-hidden">
    <div className="flex mb-6 border rounded-xl relative overflow-hidden">
      <button
        onClick={() => { setActiveTab('login'); setError(''); }}
        className={clsx(
          'w-1/2 py-2 text-lg font-semibold z-10 transition-colors',
          activeTab === 'login' ? 'text-white' : 'text-gray-700'
        )}
      >
        Login
      </button>
      <button
        onClick={() => { setActiveTab('signup'); setError(''); }}
        className={clsx(
          'w-1/2 py-2 text-lg font-semibold z-10 transition-colors',
          activeTab === 'signup' ? 'text-white' : 'text-gray-700'
        )}
      >
        Signup
      </button>
      <div
        className={clsx(
          'absolute top-0 left-0 w-1/2 h-full rounded-xl transition-transform duration-500 bg-gradient-to-r from-blue-900 to-blue-500',
          activeTab === 'signup' && 'translate-x-full'
        )}
      />
    </div>

    <div className="relative h-[480px] overflow-hidden">
      <div
        className={clsx(
          'absolute top-0 left-0 flex w-[200%] transition-transform duration-500',
          activeTab === 'signup' && '-translate-x-1/2'
        )}
      >
        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="w-1/2 px-4 flex flex-col items-center"
          autoComplete="off"
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-900">Welcome Back</h2>
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-[95%] mb-4 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-[95%] mb-3 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-[95%] mx-auto block p-3 rounded-xl bg-gradient-to-r from-blue-900 to-blue-500 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <div className="text-sm mt-4 text-center w-full">
            Not a member?{' '}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setActiveTab('signup')}
            >
              Signup now
            </span>
          </div>
        </form>

        {/* Signup Form */}
        <form
          onSubmit={handleSignup}
          className="w-1/2 px-4 flex flex-col items-center"
          autoComplete="off"
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-900">Create Account</h2>
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <input
            type="text"
            placeholder="Full Name"
            required
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            className="w-[95%] mb-3 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            className="w-[95%] mb-3 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            className="w-[95%] mb-3 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-[95%] mb-3 p-3 rounded-xl border"
            disabled={isLoading}
          />
          <select
            value={signupRole}
            onChange={(e) => setSignupRole(e.target.value as 'lawyer' | 'user')}
            className="w-[95%] mb-4 p-3 rounded-xl border"
            disabled={isLoading}
          >
            <option value="user">Public User</option>
            <option value="lawyer">Lawyer</option>
          </select>
          <button
            type="submit"
            className="w-[95%] mx-auto block p-3 rounded-xl bg-gradient-to-r from-blue-900 to-blue-500 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Signup'}
          </button>
          <div className="text-sm mt-4 text-center w-full">
            Already have an account?{' '}
            <span
              className="text-blue-600 cursor-pointer"
              onClick={() => setActiveTab('login')}
            >
              Login
            </span>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

  );
}
