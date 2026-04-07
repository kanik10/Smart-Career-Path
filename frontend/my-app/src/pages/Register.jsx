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
    name: "", email: "", password: "", confirmPassword: "",
    department: "", semester: "", dateOfBirth: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    semester: "",
    dateOfBirth: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    department: false,
    semester: false,
    dateOfBirth: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    console.log(`Toast (${type}): ${message}`);
  };

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s]+$/;

  const getPasswordStrength = (password) => {
    if (!password) return "";

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  };

  const validateDateOfBirth = (value) => {
    if (!value) return "";

    const birthDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    if (age < 16) {
      return "You must be at least 16 years old to register";
    }

    return "";
  };

  const validateField = (field, value, currentData = formData) => {
    switch (field) {
      case 'name': {
        const trimmedName = value.trim();
        if (!trimmedName || !nameRegex.test(trimmedName) || trimmedName.length < 3 || trimmedName.length > 50) {
          return "Please enter a valid name (letters only)";
        }
        return "";
      }
      case 'email':
        if (!value.trim() || !emailRegex.test(value.trim())) {
          return "Please enter a valid email address";
        }
        return "";
      case 'password':
        if (!value || !passwordRegex.test(value)) {
          return "Password must be 8+ characters with uppercase, lowercase, number & special character";
        }
        return "";
      case 'confirmPassword':
        if (!value || value !== currentData.password) {
          return "Passwords do not match";
        }
        return "";
      case 'department':
        if (!value) {
          return "Please select your department";
        }
        return "";
      case 'semester':
        if (!value) {
          return "Please select your current semester";
        }
        return "";
      case 'dateOfBirth':
        if (!value) {
          return "";
        }
        return validateDateOfBirth(value);
      default:
        return "";
    }
  };

  const validateAllFields = (data) => {
    return {
      name: validateField('name', data.name, data),
      email: validateField('email', data.email, data),
      password: validateField('password', data.password, data),
      confirmPassword: validateField('confirmPassword', data.confirmPassword, data),
      department: validateField('department', data.department, data),
      semester: validateField('semester', data.semester, data),
      dateOfBirth: validateField('dateOfBirth', data.dateOfBirth, data),
    };
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field], formData),
      ...(field === 'password'
        ? { confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData) }
        : {}),
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInputBorderStyle = (field) => {
    const value = formData[field];

    if (errors[field]) {
      return { borderColor: '#dc2626' };
    }

    if (touched[field] && String(value).trim() !== "") {
      return { borderColor: '#16a34a' };
    }

    return {};
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const requiredFieldsFilled =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password !== "" &&
    formData.confirmPassword !== "" &&
    formData.department !== "" &&
    formData.semester !== "" &&
    formData.dateOfBirth !== "";
  const hasAnyError = Object.values(errors).some((error) => error);
  const isSubmitDisabled = loading || !requiredFieldsFilled || hasAnyError;

  // --- MODIFIED SUBMIT FUNCTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitErrors = validateAllFields(formData);
    setErrors(submitErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      department: true,
      semester: true,
      dateOfBirth: true,
    });

    if (Object.values(submitErrors).some((error) => error)) {
      return;
    }

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
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              style={getInputBorderStyle('name')}
              required
            />
            {errors.name && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              style={getInputBorderStyle('email')}
              required
            />
            {errors.email && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password" type={showPassword ? "text" : "password"} placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                style={getInputBorderStyle('password')}
                required
              />
              <button
                type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.password && (
              <p className="password-strength" style={{ marginTop: '6px', color: passwordStrength === 'Strong' ? '#16a34a' : passwordStrength === 'Medium' ? '#d97706' : '#dc2626' }}>
                Password Strength: {passwordStrength}
              </p>
            )}
            {errors.password && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.password}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                style={getInputBorderStyle('confirmPassword')}
                required
              />
            </div>
            {errors.confirmPassword && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.confirmPassword}</p>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Department</label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                onBlur={() => handleFieldBlur('department')}
                style={getInputBorderStyle('department')}
                required
              >
                <option value="" disabled>Select department</option>
                {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              {errors.department && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.department}</p>}
            </div>
            <div className="form-group">
              <label>Current Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', e.target.value)}
                onBlur={() => handleFieldBlur('semester')}
                style={getInputBorderStyle('semester')}
                required
              >
                <option value="" disabled>Select semester</option>
                {semesters.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
              </select>
              {errors.semester && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.semester}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth" type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              onBlur={() => handleFieldBlur('dateOfBirth')}
              style={getInputBorderStyle('dateOfBirth')}
              required
            />
            {errors.dateOfBirth && <p className="field-error" style={{ color: '#dc2626', marginTop: '6px' }}>{errors.dateOfBirth}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitDisabled}
            style={isSubmitDisabled ? { backgroundColor: '#9ca3af', cursor: 'not-allowed', opacity: 0.8 } : {}}
          >
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