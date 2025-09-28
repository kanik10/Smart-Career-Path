// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout'; // <-- Import the layout
import Profile from './pages/Profile';

// Placeholder pages for other routes

const Announcements = () => <div>Announcements Page</div>;
const Resources = () => <div>Resources Page</div>;
const Progress = () => <div>Progress Page</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes WITHOUT the main layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Routes WITH the main layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;