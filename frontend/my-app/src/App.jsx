// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout'; // Correctly imported

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';

// Student Pages
import Dashboard from './pages/Dashboard';
const Profile = () => <div>Profile Page</div>;
const Announcements = () => <div>Announcements Page</div>;
const Resources = () => <div>Resources Page</div>;
const Progress = () => <div>Progress Page</div>;

// Admin Pages (Placeholders for now)
import AdminDashboard from './pages/AdminDashboard';
const AdminAnnouncements = () => <h1>Manage Announcements</h1>;
const AdminResources = () => <h1>Manage Resources</h1>;
const UserManagement = () => <h1>Manage Users</h1>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes (No Layout) --- */}
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

        {/* --- CORRECTED ADMIN ROUTES (Inside Admin Layout) --- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="resources/placements" element={<div>Manage Placements Resources</div>} />
          <Route path="resources/higher-studies" element={<div>Manage Higher Studies Resources</div>} />
          <Route path="resources/entrepreneurship" element={<div>Manage Entrepreneurship Resources</div>} />
          <Route path="user-management" element={<UserManagement />} />
          {/* This redirects /admin to /admin/dashboard by default */}
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;