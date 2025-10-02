// src/components/AdminLayout.jsx

import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import vppcoeLogo from '../assets/vppcoe-logo.png';
import { LayoutDashboard, Megaphone, BookCopy, Users, LogOut } from 'lucide-react';
import { useState } from 'react';

// Corrected admin navigation paths
const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  {
    path: '/admin/resources', // Base path for checking active state
    label: 'Resources',
    icon: BookCopy,
    subPaths: [
      { path: '/admin/resources/placements', label: 'Placements' },
      { path: '/admin/resources/higher-studies', label: 'Higher Studies' },
      { path: '/admin/resources/entrepreneurship', label: 'Entrepreneurship' },
    ],
  },
  { path: '/admin/user-management', label: 'User Management', icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const handleLogout = () => {
    console.log('Admin logged out');
    navigate('/login');
  };

  const handleNavClick = (label) => {
    if (label === 'Resources') {
      setOpenSubmenu(openSubmenu === 'Resources' ? null : 'Resources');
    } else {
      setOpenSubmenu(null);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <nav>
          <ul className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check if a sub-item is active
              const isParentActive = item.subPaths && location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  {item.subPaths ? (
                    // Render a div for items with sub-menus (like Resources)
                    <div
                      className={`sidebar-nav-link ${isParentActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.label)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    // Render a NavLink for regular menu items
                    <NavLink
                      to={item.path}
                      className="sidebar-nav-link"
                      onClick={() => handleNavClick(item.label)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </NavLink>
                  )}
                  {item.subPaths && openSubmenu === item.label && (
                    <ul className="submenu">
                      {item.subPaths.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink to={subItem.path} className="sidebar-nav-link sub-link">
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ... rest of your component remains the same ... */}
       <div className="main-view">
        <header className="app-header">
          <div className="header-title-group">
            <img src={vppcoeLogo} alt="VPPCOE Logo" />
            <div className="header-title-text">
              <h1>Smart Career Path – Admin Panel</h1>
              <p>Admin access – VPPCOE only</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
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