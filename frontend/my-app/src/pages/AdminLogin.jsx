import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import vppcoeLogo from '../assets/vppcoe-logo.png';
import { toBackendUrl } from '../utils/backendUrl';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
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

  const validateCredentials = () => {
    if (!emailRegex.test(email.trim())) {
      showToast('Invalid admin email format', 'error');
      return false;
    }

    if (!password || password.length < 6) {
      showToast('Invalid password. Minimum 6 characters required.', 'error');
      return false;
    }

    return true;
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();

    if (!validateCredentials()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(toBackendUrl('/api/users/admin/login/request-otp'), {
        email,
        password,
      });
      setOtpRequested(true);

      if (data?.devOtp) {
        setOtp(String(data.devOtp));
        showToast(`Email failed. Using dev OTP: ${data.devOtp}`, 'success');
      } else {
        showToast(data?.message || 'OTP sent to admin email', 'success');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!validateCredentials()) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(toBackendUrl('/api/users/admin/login/resend-otp'), {
        email,
        password,
      });

      if (data?.devOtp) {
        setOtp(String(data.devOtp));
        showToast(`Email failed. Using dev OTP: ${data.devOtp}`, 'success');
      } else {
        showToast(data?.message || 'OTP resent to admin email', 'success');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!validateCredentials()) {
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(toBackendUrl('/api/users/admin/login/verify-otp'), {
        email,
        password,
        otp: otp.trim(),
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      showToast('Admin login successful!', 'success');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      showToast(message, 'error');
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
          <p className="description">Admin login with OTP</p>
        </header>

        <main className="auth-content">
          <form onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="password-wrapper">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
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

            {otpRequested ? (
              <div className="form-group">
                <label htmlFor="admin-otp">OTP</label>
                <input
                  id="admin-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : otpRequested ? 'Verify OTP & Login' : 'Send OTP'}
            </button>

            {otpRequested ? (
              <button type="button" className="btn btn-outline" onClick={handleResendOtp} disabled={loading}>
                Resend OTP
              </button>
            ) : null}
          </form>
        </main>
      </div>
    </div>
  );
}
