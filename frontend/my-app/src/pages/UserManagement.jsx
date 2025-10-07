import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import './UserManagement.css';

const departments = [
  'All Departments',
  'Computer Engineering',
  'Information Technology',
  'AI&ML',
  'Electronics',
  'Mechanical'
];

const batches = ['All Batches', '2024', '2025', '2026'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAccounts: 0,
    placementTrack: 0,
    departments: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [selectedDepartment, selectedBatch]);

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        throw new Error('Not authorized');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      const { data } = await axios.get('http://localhost:5000/api/admin/users', config);
      setUsers(data.users);
      setStats({
        totalStudents: data.stats.totalStudents,
        activeAccounts: data.stats.activeAccounts,
        placementTrack: data.stats.placementTrack,
        departments: data.stats.departments
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}/status`, 
        { status: newStatus },
        config
      );

      // Update local state
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
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      await axios.post(`http://localhost:5000/api/admin/users/${userId}/reset-password`, {}, config);
      alert('Password has been reset successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || user.department === selectedDepartment;
    const matchesBatch = selectedBatch === 'All Batches' || user.batch === selectedBatch;
    return matchesSearch && matchesDepartment && matchesBatch;
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="user-management">
      <header className="page-header">
        <h1>User Management</h1>
        <p>Manage student accounts and permissions</p>
      </header>

      <section className="filters-section">
        <div className="search-filter">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card">
          <span className="stat-number">{stats.totalStudents}</span>
          <span className="stat-label">Total Students</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.activeAccounts}</span>
          <span className="stat-label">Active Accounts</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.placementTrack}</span>
          <span className="stat-label">Placement Track</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.departments}</span>
          <span className="stat-label">Departments</span>
        </div>
      </section>

      <section className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Career Path</th>
              <th>Batch</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.department}</td>
                <td>{user.careerPath}</td>
                <td>{user.batch}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td className="actions">
                  <button
                    onClick={() => handleStatusChange(user._id, user.status)}
                    className="action-btn"
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleResetPassword(user._id)}
                    className="action-btn reset"
                  >
                    Reset
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