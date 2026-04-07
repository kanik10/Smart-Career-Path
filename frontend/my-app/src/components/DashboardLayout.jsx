// src/components/DashboardLayout.jsx

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import vppcoeLogo from '../assets/vppcoe-logo.png';
// Import the necessary icons
import { LayoutDashboard, User, Megaphone, BookCopy, BarChart2, LogOut, Trophy } from 'lucide-react';

// Add an 'icon' property to each navigation item
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/resources', label: 'Resources', icon: BookCopy },
  { path: '/progress', label: 'Progress', icon: BarChart2 },
  { path: '/gamification', label: 'Game Arena', icon: Trophy },
];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('User logged out');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* The title group has been moved from here */}
        <nav>
          <ul className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon; // Get the icon component
              return (
                <li key={item.path}>
                  <NavLink to={item.path} className="sidebar-nav-link">
                    <Icon size={20} /> {/* Render the icon */}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="main-view">
        <header className="app-header">
          {/* Title group is now in the header */}
          <div className="header-title-group">
            <img src={vppcoeLogo} alt="VPPCOE Logo" />
            <div className="header-title-text">
              <h1>Smart Career Path</h1>
              <p>made specially for VPPCOE students</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} /> {/* Add logout icon */}
            <span>Logout</span>
          </button>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}