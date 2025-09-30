// src/pages/AdminDashboard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, FileText, Bell, BookOpen } from 'lucide-react';
import './AdminDashboard.css'; // Assume some basic styles for the dashboard

const stats = { totalStudents: 152, newSignups: 12, resourcesCount: 45 };

const recentUsers = [
  { id: 1, name: 'Priya Sharma', email: 'priya.s@example.com', date: '2025-09-30' },
  { id: 2, name: 'Rohan Verma', email: 'rohan.v@example.com', date: '2025-09-30' },
  { id: 3, name: 'Anjali Mehta', email: 'anjali.m@example.com', date: '2025-09-29' },
];

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the platform's activity and management tools.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users"><Users /></div>
          <div className="stat-info"><span className="stat-number">{stats.totalStudents}</span><span className="stat-label">Total Students</span></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon signups"><UserPlus /></div>
          <div className="stat-info"><span className="stat-number">{stats.newSignups}</span><span className="stat-label">New Sign-ups (7 days)</span></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon resources"><FileText /></div>
          <div className="stat-info"><span className="stat-number">{stats.resourcesCount}</span><span className="stat-label">Total Resources</span></div>
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="admin-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/admin/user-management" className="action-button"><Users size={20} /> Manage Users</Link>
            <Link to="/admin/announcements" className="action-button"><Bell size={20} /> Post Announcement</Link>
            <Link to="/admin/resources" className="action-button"><BookOpen size={20} /> Update Resources</Link>
          </div>
        </div>
        <div className="admin-card">
          <h2>Recent Student Registrations</h2>
          <div className="user-list">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Date Joined</th></tr></thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}