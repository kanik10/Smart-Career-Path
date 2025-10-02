import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [error, setError] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    category: 'event',
    date: '',
    time: '',
    period: 'AM',
    venue: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchAnnouncements = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/announcements', config);
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }
    fetchAnnouncements();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        setError('You must be logged in');
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      // Combine date and time with AM/PM
      const [year, month, day] = newAnnouncement.date.split('-');
      const [hours, minutes] = newAnnouncement.time.split(':');
      let hour = parseInt(hours);
      
      // Convert to 24-hour format
      if (newAnnouncement.period === 'PM' && hour < 12) {
        hour += 12;
      } else if (newAnnouncement.period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const dateTime = new Date(year, month - 1, day, hour, parseInt(minutes));
      
      const announcementData = {
        ...newAnnouncement,
        date: dateTime.toISOString(),
      };
      
      await axios.post('http://localhost:5000/api/announcements', announcementData, config);
      setNewAnnouncement({
        title: '',
        description: '',
        category: 'event',
        date: '',
        time: '',
        period: 'AM',
        venue: '',
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError(error.response?.data?.message || 'Failed to create announcement');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5000/api/announcements/${id}`, editForm, config);
      setEditingId(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5000/api/announcements/${id}/complete`, {}, config);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error completing announcement:', error);
    }
  };

  const startEdit = (announcement) => {
    setEditingId(announcement._id);
    setEditForm(announcement);
  };

  const filteredAnnouncements = announcements.filter(
    (a) => a.status === activeTab
  );

  return (
    <div className="admin-announcements">
      <div className="page-header">
        <h1>Announcements Management</h1>
        <p>Manage all announcements and updates</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === 'ongoing' ? 'active' : ''}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing ({announcements.filter(a => a.status === 'ongoing').length})
        </button>
        <button
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({announcements.filter(a => a.status === 'completed').length})
        </button>
      </div>

      {/* Add New Announcement Form */}
      <div className="add-announcement-section">
        <button className="add-button" onClick={() => document.getElementById('newAnnouncementForm').style.display = 'block'}>
          + Add New Announcement
        </button>
        
        <form id="newAnnouncementForm" style={{display: 'none'}} onSubmit={handleCreate}>
          {error && <div className="error-message">{error}</div>}
          <input
            type="text"
            placeholder="Title"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            value={newAnnouncement.description}
            onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
            required
          />
          <select
            value={newAnnouncement.category}
            onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
            required
          >
            <option value="event">Event</option>
            <option value="placement">Placement</option>
            <option value="workshop">Workshop</option>
            <option value="internship">Internship</option>
          </select>
          <div className="datetime-group">
            <input
              type="date"
              value={newAnnouncement.date}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
              required
            />
            <div className="time-group">
              <input
                type="time"
                value={newAnnouncement.time}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, time: e.target.value})}
                required
              />
              <select
                value={newAnnouncement.period}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, period: e.target.value})}
                required
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Venue"
            value={newAnnouncement.venue}
            onChange={(e) => setNewAnnouncement({...newAnnouncement, venue: e.target.value})}
            required
          />
          <div className="form-buttons">
            <button type="submit">Create</button>
            <button type="button" onClick={() => document.getElementById('newAnnouncementForm').style.display = 'none'}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="announcements-list">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement._id} className="announcement-card">
            <div className="announcement-header">
              <span className={`tag ${announcement.category}`}>
                {announcement.category}
              </span>
              {activeTab === 'ongoing' && (
                <div className="actions">
                  <button onClick={() => startEdit(announcement)} className="icon-button">
                    <Edit size={18} />
                    Edit
                  </button>
                  <button onClick={() => handleComplete(announcement._id)} className="icon-button">
                    <CheckCircle size={18} />
                    Complete
                  </button>
                </div>
              )}
            </div>

            {editingId === announcement._id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(announcement._id); }}>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  required
                />
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  required
                >
                  <option value="event">Event</option>
                  <option value="placement">Placement</option>
                  <option value="workshop">Workshop</option>
                  <option value="internship">Internship</option>
                </select>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  required
                />
                <input
                  type="text"
                  value={editForm.venue}
                  onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
                  required
                />
                <div className="form-buttons">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h3>{announcement.title}</h3>
                <p>{announcement.description}</p>
                <div className="announcement-details">
                  <span>📅 {new Date(announcement.date).toLocaleString()}</span>
                  <span>📍 {announcement.venue}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}