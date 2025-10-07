// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';

// --- THIS IS THE FIX ---
// Import the REAL component files instead of using placeholders
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Announcements from './pages/Announcements';
import Resources from './pages/Resources';
import Progress from './pages/Progress';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminResourceCategoryPage from './pages/AdminResourceCategoryPage'; 
const UserManagement = () => <h1>Manage Users</h1>;


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* --- Student Routes (Inside Student Layout) --- */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/progress" element={<Progress />} />
        </Route>

        {/* --- Admin Routes (Inside Admin Layout) --- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="resources/:careerPath" element={<AdminResourceCategoryPage />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;