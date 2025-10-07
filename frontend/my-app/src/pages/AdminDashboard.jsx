// src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, FileText, Bell, BookOpen, Trophy } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './AdminDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
          navigate('/login');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/admin/stats', config);
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const chartData = {
    labels: dashboardData?.careerPathDistribution.map(d => d.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())) || [],
    datasets: [{
      data: dashboardData?.careerPathDistribution.map(d => d.count) || [],
      backgroundColor: [
        'rgba(122, 105, 139, 1)', // Primary
        'rgba(225, 197, 183, 1)', // Secondary
        'rgba(196, 167, 161, 1)', // Accent
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: "'Poppins', sans-serif" } } },
      title: { display: false },
    },
  };

  if (loading) {
    return <div style={{padding: '2rem'}}>Loading Admin Dashboard...</div>;
  }
  
  if (!dashboardData) {
      return <div style={{padding: '2rem'}}>Failed to load data. Please try again.</div>
  }

  const { stats, recentUsers, leaderboard } = dashboardData;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the platform's activity and management tools.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="stat-icon users"><Users /></div><div className="stat-info"><span className="stat-number">{stats.totalStudents}</span><span className="stat-label">Total Students</span></div></div>
        <div className="admin-stat-card"><div className="stat-icon signups"><UserPlus /></div><div className="stat-info"><span className="stat-number">{stats.newSignups}</span><span className="stat-label">New Sign-ups (7 days)</span></div></div>
        <div className="admin-stat-card"><div className="stat-icon resources"><FileText /></div><div className="stat-info"><span className="stat-number">{stats.totalResources}</span><span className="stat-label">Total Resources</span></div></div>
      </div>
      
      <div className="admin-main-grid">
        <div className="admin-card chart-card">
          <h2>Career Path Distribution</h2>
          {/* --- 2. ADDED: Wrapper div to control chart size --- */}
          <div className="chart-container">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="admin-card">
          <h2><Trophy size={20}/> Student Leaderboard</h2>
          <div className="leaderboard-list">
            {leaderboard.map((student, index) => (
              <div key={student._id} className="leaderboard-item">
                <span className="leaderboard-rank">{index + 1}</span>
                <span className="leaderboard-name">{student.name}</span>
                <span className="leaderboard-score">{student.completedCoursesCount} courses</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="admin-card">
          <h2>Quick Actions</h2>
          {/* --- 1. ADDED: Links for the Quick Actions section --- */}
          <div className="quick-actions">
            <Link to="/admin/user-management" className="action-button"><Users size={20} /> Manage Users</Link>
            <Link to="/admin/announcements" className="action-button"><Bell size={20} /> Post Announcement</Link>
            <Link to="/admin/resources/placements" className="action-button"><BookOpen size={20} /> Update Resources</Link>
          </div>
        </div>
        <div className="admin-card">
          <h2>Recent Student Registrations</h2>
          <div className="user-list">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Date Joined</th></tr></thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}