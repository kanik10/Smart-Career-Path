// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    console.log(`Toast (${type}): ${message}`);
  };

  // --- UNIFIED LOGIN FUNCTION ---
  const handleLogin = async (e) => {
    e.preventDefault();
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
      const message = error.response?.data?.message || "Login failed. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminView = (isAdmin) => {
    setIsAdminLogin(isAdmin);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
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
              <input
                id="password" type="password" placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
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