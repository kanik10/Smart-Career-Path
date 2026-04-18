// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { toBackendUrl } from '../utils/backendUrl';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current.message === message ? { message: '', type: 'success' } : current));
    }, 2800);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailRegex.test(email.trim())) {
      showToast('Invalid email format', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showToast('Invalid password. Minimum 6 characters required.', 'error');
      return;
    }

    setLoading(true);

    try {
      const loginData = { email, password };
      const response = await axios.post(toBackendUrl('/api/users/login'), loginData);
      const { data } = response;

      localStorage.setItem('userInfo', JSON.stringify(data));
      showToast('Login successful!', 'success');

      if (data.isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      let message = error.response?.data?.message || 'Login failed. Please try again.';
      if (error.response?.status === 401) {
        message = 'Incorrect email or password';
      }
      if (error.response?.status === 403) {
        message = error.response?.data?.message || 'Your account is inactive. Contact admin.';
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {toast.message ? (
          <div className={`auth-toast ${toast.type === 'error' ? 'error' : 'success'}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        ) : null}

        <header className="auth-header">
          <img src={vppcoeLogo} alt="VPPCOE Logo" className="logo" />
          <h1 className="title">Smart Career Path</h1>
          <p className="description">Login to your VPPCOE student account</p>
        </header>

        <main className="auth-content">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email" type="email" placeholder="Enter your email"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <footer className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="toggle-link">
                Register here
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}