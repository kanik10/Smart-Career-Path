// src/pages/Register.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from 'axios'; // Import axios

const departments = [
  "Computer Engineering", "Information Technology", "Artificial Intelligence",
  "Mechatronics", "Electronics & Computer Science Engineering",
];

const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function Register() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "",
    department: "", semester: "", dateOfBirth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    console.log(`Toast (${type}): ${message}`);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- MODIFIED SUBMIT FUNCTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send a POST request to your backend register endpoint
      const response = await axios.post('http://localhost:5000/api/users/register', formData);

      // On success, the backend sends back user data and a token
      const { data } = response;
      
      // Store user info and token in localStorage to keep them logged in
      localStorage.setItem('userInfo', JSON.stringify(data));

      showToast("Registration successful! Please take the career quiz.", "success");
      navigate('/quiz');

    } catch (error) {
      // Handle errors from the backend (e.g., user already exists)
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      showToast(message, "error");
    } finally {
      // This will run whether the request succeeds or fails
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <header className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Start your journey towards a successful career</p>
        </header>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name" type="text" placeholder="Enter your full name"
              value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" placeholder="Enter your email"
              value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password" type={showPassword ? "text" : "password"} placeholder="Create a password"
                value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required
              />
              <button
                type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Department</label>
              <select onChange={(e) => handleInputChange('department', e.target.value)} defaultValue="" required>
                <option value="" disabled>Select department</option>
                {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Current Semester</label>
              <select onChange={(e) => handleInputChange('semester', e.target.value)} defaultValue="" required>
                <option value="" disabled>Select semester</option>
                {semesters.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth" type="date"
              value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <footer className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="toggle-link">Sign in</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}