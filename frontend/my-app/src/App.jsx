// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
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
import UserManagement from './pages/UserManagement';
import AdminStudentProgress from './pages/AdminStudentProgress';

// Gamification Pages
import GamificationHub from './pages/gamification/GamificationHub';
import GamificationArena from './pages/gamification/GamificationArena';
import SprintGame from './pages/gamification/SprintGame';
import SpinGame from './pages/gamification/SpinGame';
import FlashcardsGame from './pages/gamification/FlashcardsGame';
import BossBattleGame from './pages/gamification/BossBattleGame';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
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
          
          {/* Gamification Routes */}
          <Route path="/gamification" element={<GamificationHub />} />
          <Route path="/gamification/arena" element={<GamificationArena />} />
          <Route path="/gamification/sprint" element={<SprintGame />} />
          <Route path="/gamification/spin" element={<SpinGame />} />
          <Route path="/gamification/flashcards" element={<FlashcardsGame />} />
          <Route path="/gamification/boss-battle" element={<BossBattleGame />} />
        </Route>

        {/* --- Admin Routes (Inside Admin Layout) --- */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="student-progress" element={<AdminStudentProgress />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="resources/:careerPath" element={<AdminResourceCategoryPage />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;