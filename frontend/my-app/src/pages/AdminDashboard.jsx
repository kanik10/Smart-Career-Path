// src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, FileText, Bell, BookOpen } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import './AdminDashboard.css';

const COLORS = ['#4299e1', '#48bb78', '#f6ad55']; // Updated colors for better visibility

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalStudents: 0, newSignups: 0, resourcesCount: 0 });
  const [distribution, setDistribution] = useState({
    placement: 0,
    higherStudies: 0,
    entrepreneurship: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          navigate('/login');
          return;
        }

        const config = { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}` 
          }
        };
        
        const { data } = await axios.get('http://localhost:5000/api/dashboard/admin/stats', config);
        console.log('Dashboard data:', data); // For debugging
        
        if (data && data.stats) {
          setStats(data.stats);
          setDistribution(data.careerPathDistribution || {
            placement: 0,
            higherStudies: 0,
            entrepreneurship: 0
          });
          setRecentUsers(data.recentUsers || []);
          setLeaderboard(data.leaderboard || []);
          setLoading(false);
        } else {
          throw new Error('Invalid data structure received from server');
        }
      } catch (err) {
        console.error('Dashboard error:', err); // For debugging
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const pieData = [
    { name: 'Placement', value: distribution.placement },
    { name: 'Higher Studies', value: distribution.higherStudies },
    { name: 'Entrepreneurship', value: distribution.entrepreneurship }
  ];

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the platform's activity and management tools.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users"><Users /></div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalStudents}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon signups"><UserPlus /></div>
          <div className="stat-info">
            <span className="stat-number">{stats.newSignups}</span>
            <span className="stat-label">New Sign-ups (7 days)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon resources"><FileText /></div>
          <div className="stat-info">
            <span className="stat-number">{stats.resourcesCount}</span>
            <span className="stat-label">Total Resources</span>
          </div>
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="admin-card">
          <h2>Career Path Distribution</h2>
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: '#4a5568' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <h2>Student Leaderboard</h2>
          <div className="leaderboard">
            {leaderboard.length > 0 ? (
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Courses Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student, index) => (
                    <tr key={student._id}>
                      <td className="rank">#{index + 1}</td>
                      <td>{student.name}</td>
                      <td className="courses-count">{student.completedCoursesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No leaderboard data available yet.</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/admin/user-management" className="action-button">
              <Users size={20} /> Manage Users
            </Link>
            <Link to="/admin/announcements" className="action-button">
              <Bell size={20} /> Post Announcement
            </Link>
            <Link to="/admin/resources/placements" className="action-button">
              <BookOpen size={20} /> Update Resources
            </Link>
          </div>
        </div>

        <div className="admin-card">
          <h2>Recent Student Registrations</h2>
          <div className="user-list">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}