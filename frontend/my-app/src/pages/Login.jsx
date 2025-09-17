// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    console.log(`Toast (${type}): ${message}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = { email, password };
      const response = await axios.post('http://localhost:5000/api/users/login', loginData);
      const { data } = response;

      localStorage.setItem('userInfo', JSON.stringify(data));
      showToast('Login successful!', 'success');
      navigate('/dashboard');

    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <img src={vppcoeLogo} alt="VPPCOE Logo" className="logo" />
          <h1 className="title">Smart Career Path</h1>
          <p className="description">
            Login to your VPPCOE student account
          </p>
        </header>

        <main className="auth-content">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Google Button and Separator have been removed from here */}

          <footer className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="toggle-link">
                Create account
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}