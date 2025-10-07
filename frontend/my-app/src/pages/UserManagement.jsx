// src/pages/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import axios from 'axios';
import './UserManagement.css';

// Corrected and official lists for filters
const departments = [
  'All Departments', 'Computer Engineering', 'Information Technology', 
  'Artificial Intelligence', 'Electronic & Computer Science', 'Mechatronics'
];
const semesters = ['All Semesters', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const careerPaths = ['placements', 'higher-studies', 'entrepreneurship'];

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
        navigate('/login');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/admin/users', config);

      setUsers(data.users || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}/status`, { status: newStatus }, config);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`http://localhost:5000/api/admin/users/${userId}/reset-password`, {}, config);
      alert(data.message); // Show the message with the temp password from the server
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleCareerPathChange = async (userId, newCareerPath) => {
    if (!newCareerPath) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/career-path`, { careerPath: newCareerPath }, config);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, careerPath: newCareerPath } : user
      ));
      alert('Career path updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update career path');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || user.department === selectedDepartment;
    const matchesSemester = selectedSemester === 'All Semesters' || user.semester === user.semester;
    return matchesSearch && matchesDepartment && matchesSemester;
  });

  if (loading) return <div className="loading" style={{padding: '2rem'}}>Loading user data...</div>;
  if (error) return <div className="error-message" style={{padding: '2rem', color: 'red'}}>{error}</div>;

  return (
    <div className="user-management">
      <header className="page-header">
        <h1>User Management</h1>
        <p>Manage student accounts, permissions, and career paths</p>
      </header>

      <section className="stats-section">
        <div className="stat-card"><span className="stat-number">{stats.totalStudents || 0}</span><span className="stat-label">Total Students</span></div>
        <div className="stat-card"><span className="stat-number">{stats.activeAccounts || 0}</span><span className="stat-label">Active Accounts</span></div>
        <div className="stat-card"><span className="stat-number">{stats.placementTrack || 0}</span><span className="stat-label">Placement Track</span></div>
        <div className="stat-card"><span className="stat-number">{stats.departments || 0}</span><span className="stat-label">Departments</span></div>
      </section>

      <section className="filters-section">
        <div className="search-filter">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
          </select>
        </div>
      </section>

      <section className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>Career Path</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td>{user.semester}</td>
                <td>
                  <select defaultValue={user.careerPath || ''} onChange={(e) => handleCareerPathChange(user._id, e.target.value)} className="career-path-select">
                    <option value="" disabled>Not chosen</option>
                    {careerPaths.map(path => <option key={path} value={path}>{path.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </td>
                <td><span className={`status-badge status-${user.status}`}>{user.status}</span></td>
                <td className="actions">
                  <button onClick={() => handleStatusChange(user._id, user.status)} className="action-btn">
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleResetPassword(user._id)} className="action-btn reset">
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}