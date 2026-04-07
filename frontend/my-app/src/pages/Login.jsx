// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import axios from 'axios';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
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

  // --- UNIFIED LOGIN FUNCTION ---
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
      // All login attempts go to the same backend endpoint
      const loginData = { email, password };
      const response = await axios.post('http://localhost:5000/api/users/login', loginData);
      const { data } = response;

      // Store user info (which includes the 'isAdmin' flag) in localStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      showToast('Login successful!', 'success');

      // Check the 'isAdmin' flag from the backend response
      if (data.isAdmin) {
        // If user is an admin, navigate to the admin dashboard
        navigate('/admin/dashboard');
      } else {
        // If user is a student, navigate to the student dashboard
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

  const toggleAdminView = (isAdmin) => {
    setIsAdminLogin(isAdmin);
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {toast.message ? (
          <div className={`auth-toast ${toast.type === 'error' ? 'error' : 'success'}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        ) : null}

        {isAdminLogin && (
          <button onClick={() => toggleAdminView(false)} className="back-button">
            <ArrowLeft size={20} /> Back
          </button>
        )}

        <header className="auth-header">
          <img src={vppcoeLogo} alt="VPPCOE Logo" className="logo" />
          <h1 className="title">Smart Career Path</h1>
          <p className="description">
            {isAdminLogin ? 'Admin Panel - VPPCOE Only' : 'Login to your VPPCOE student account'}
          </p>
        </header>

        <main className="auth-content">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{isAdminLogin ? 'Admin Email' : 'Email Address'}</label>
              <input
                id="email" type="email" placeholder={isAdminLogin ? 'Enter admin email' : 'Enter your email'}
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
              {loading ? 'Signing in...' : (isAdminLogin ? 'Sign In as Admin' : 'Sign In')}
            </button>
          </form>

          {!isAdminLogin && (
            <>
              <footer className="auth-footer">
                <p>
                  Don't have an account?{' '}
                  <Link to="/register" className="toggle-link">
                    Register here
                  </Link>
                </p>
              </footer>
              <div className="separator"><span>OR</span></div>
              <button onClick={() => toggleAdminView(true)} className="btn btn-outline">
                Login as Admin
              </button>
            </>
          )}
        </main>
      </div>
    </div>
  );
}